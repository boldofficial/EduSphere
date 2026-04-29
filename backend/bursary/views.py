from django.conf import settings
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, Value, When
from django.db.models.functions import Coalesce
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

import logging
logger = logging.getLogger(__name__)

from academic.models import AcademicTerm, Student, Teacher
from core.pagination import LargePagination, StandardPagination
from core.tenant_utils import get_request_school
from schools.models import SchoolSettings
from users.models import User

from .models import (
    AdmissionPackage,
    Expense,
    FeeCategory,
    FeeItem,
    Payment,
    PaymentLineItem,
    Payroll,
    PayrollEntry,
    SalaryAllowance,
    SalaryDeduction,
    Scholarship,
    StaffSalaryStructure,
    StudentFee,
    FeeDiscount,
)
from .services import apply_bulk_discount, preview_bulk_discount
from .serializers import (
    AdmissionPackageSerializer,
    ExpenseSerializer,
    FeeCategorySerializer,
    FeeItemSerializer,
    PaymentSerializer,
    PayrollEntrySerializer,
    PayrollSerializer,
    SalaryAllowanceSerializer,
    SalaryDeductionSerializer,
    ScholarshipSerializer,
    StaffSalaryStructureSerializer,
    StudentFeeSerializer,
    FeeDiscountSerializer,
)


def calculate_expected_revenue(school, session=None, term=None):
    """
    Calculate net expected revenue from assigned fees, accounting for discounts
    and scholarships.
    """
    filters = {"school": school}
    if session:
        filters["fee_item__session"] = session
    if term:
        filters["fee_item__term"] = term

    money_field = DecimalField(max_digits=12, decimal_places=2)
    scholarship_discount = Case(
        When(
            scholarship__benefit_type="percentage",
            then=ExpressionWrapper(F("fee_item__amount") * F("scholarship__value") / Value(100), output_field=money_field),
        ),
        When(scholarship__benefit_type="fixed", then=F("scholarship__value")),
        default=Value(0),
        output_field=money_field,
    )
    net_due = ExpressionWrapper(F("fee_item__amount") - F("discount_amount") - scholarship_discount, output_field=money_field)

    return (
        StudentFee.objects.filter(**filters).aggregate(total=Coalesce(Sum(net_due), Value(0), output_field=money_field))[
            "total"
        ]
        or 0
    )


def _is_truthy(value):
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _resolve_period_filters(request, school):
    """
    Resolve period filters from query params.
    Defaults to school's current session/term unless include_all_periods=true.
    """
    session = request.query_params.get("session")
    term = request.query_params.get("term")
    include_all_periods = _is_truthy(request.query_params.get("include_all_periods"))

    if not include_all_periods and school:
        settings_obj = SchoolSettings.objects.filter(school=school).only("current_session", "current_term").first()
        if settings_obj:
            session = session or settings_obj.current_session
            term = term or settings_obj.current_term

    return session, term


class TenantViewSet(viewsets.ModelViewSet):
    """Base ViewSet ensuring data isolation by School."""

    permission_classes = [permissions.IsAuthenticated]

    def _enforce_related_school(self, value, school, field_name="field"):
        if value is None or school is None:
            return

        if hasattr(value, "school"):
            related_school = getattr(value, "school", None)
            if related_school and related_school != school:
                raise PermissionDenied(f"{field_name} must belong to your school.")
            return

        if isinstance(value, dict):
            for key, item in value.items():
                self._enforce_related_school(item, school, f"{field_name}.{key}")
            return

        if isinstance(value, (list, tuple, set)):
            for index, item in enumerate(value):
                self._enforce_related_school(item, school, f"{field_name}[{index}]")

    def get_queryset(self):
        school = get_request_school(self.request)
        if not school:
            return self.queryset.none()

        return self.queryset.filter(school=school)

    def perform_create(self, serializer):
        school = get_request_school(self.request)
        for field_name, value in serializer.validated_data.items():
            self._enforce_related_school(value, school, field_name)
        if not school:
            raise PermissionDenied("School context not found.")
        serializer.save(school=school)

    def perform_update(self, serializer):
        school = get_request_school(self.request)
        for field_name, value in serializer.validated_data.items():
            self._enforce_related_school(value, school, field_name)
        super().perform_update(serializer)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read access to all authenticated users, but write access only to admins and staff."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ("SUPER_ADMIN", "SCHOOL_ADMIN", "STAFF")


class FeeCategoryViewSet(TenantViewSet):
    queryset = FeeCategory.objects.order_by('name').all()
    serializer_class = FeeCategorySerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class ScholarshipViewSet(TenantViewSet):
    queryset = Scholarship.objects.order_by('-created_at').all()
    serializer_class = ScholarshipSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class FeeItemViewSet(TenantViewSet):
    queryset = FeeItem.objects.order_by('-created_at').all()
    serializer_class = FeeItemSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        school = get_request_school(self.request)
        session, term = _resolve_period_filters(self.request, school)
        class_id = self.request.query_params.get("class_id")

        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        if class_id:
            qs = qs.filter(target_class_id=class_id)
        return qs


class StudentFeeViewSet(TenantViewSet):
    queryset = StudentFee.objects.select_related("student", "fee_item").all()
    serializer_class = StudentFeeSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        return qs


class PaymentViewSet(TenantViewSet):
    queryset = Payment.objects.select_related("student").all()
    serializer_class = PaymentSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        school = get_request_school(self.request)
        session, term = _resolve_period_filters(self.request, school)
        student_id = self.request.query_params.get("student")

        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        elif user.role == "PARENT":
            qs = qs.filter(student__parent_email=user.email)

        if student_id:
            qs = qs.filter(student_id=student_id)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        return qs


class InitializePaystackPayment(APIView):
    """
    Initialize a Paystack payment for school fees.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from core.payment_utils import get_paystack_service, PaystackError
        
        try:
            paystack = get_paystack_service()
        except PaystackError as e:
            return Response({"error": str(e)}, status=400)
        
        # Get parameters
        student_id = request.data.get("student_id")
        amount = request.data.get("amount")
        term = request.data.get("term")
        session = request.data.get("session")
        
        if not all([student_id, amount, term, session]):
            return Response(
                {"error": "Missing required fields: student_id, amount, term, session"},
                status=400
            )
        
        # Get student
        from academic.models import Student
        try:
            student = Student.objects.get(id=student_id, school=request.tenant)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)
        
        # Generate unique reference
        reference = paystack.generate_reference(
            request.tenant.id,
            student.id,
            term
        )
        
        # Build callback URL
        callback_url = f"{settings.FRONTEND_URL}/api/bursary/payment/callback"
        
        # Get user email/phone
        email = student.parent_email or (student.user.email if hasattr(student, 'user') else None)
        if not email:
            return Response({"error": "No email on file for student"}, status=400)
        
        phone = student.parent_phone or ""
        
        # Initialize payment
        try:
            result = paystack.initialize_payment(
                email=email,
                amount=float(amount),
                reference=reference,
                callback_url=callback_url,
                name=student.names,
                phone=phone,
                metadata={
                    "student_id": student.id,
                    "student_name": student.names,
                    "school_id": request.tenant.id,
                    "term": term,
                    "session": session,
                }
            )
            
            return Response({
                "authorization_url": result.get("authorization_url"),
                "reference": reference,
                "access_code": result.get("access_code"),
            })
            
        except PaystackError as e:
            return Response({"error": str(e)}, status=500)


class VerifyPaystackPayment(APIView):
    """
    Verify a Paystack payment and create Payment record.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from core.payment_utils import get_paystack_service, PaystackError
        
        reference = request.data.get("reference")
        if not reference:
            return Response({"error": "Reference required"}, status=400)
        
        try:
            paystack = get_paystack_service()
            result = paystack.verify_payment(reference)
        except PaystackError as e:
            return Response({"error": str(e)}, status=400)
        
        # Check payment status
        status = result.get("status")
        if status != "success":
            return Response(
                {"error": "Payment not successful", "status": status},
                status=400
            )
        
        # Get payment data
        amount = result.get("amount", 0) / 100  # Convert from kobo
        metadata = result.get("metadata", {})
        
        student_id = metadata.get("student_id")
        term = metadata.get("term")
        session = metadata.get("session")
        
        if not student_id:
            return Response({"error": "Invalid payment metadata"}, status=400)
        
        # Create or update payment record
        try:
            with transaction.atomic():
                # Check if payment already exists
                payment, created = Payment.objects.get_or_create(
                    gateway_reference=reference,
                    defaults={
                        "student_id": student_id,
                        "amount": amount,
                        "method": "online",
                        "status": "completed",
                        "term": term,
                        "session": session,
                        "reference": f"ONL-{reference[:8]}",
                        "verification_data": result,
                        "recorded_by": request.user.username,
                    }
                )
                
                if not created:
                    payment.status = "completed"
                    payment.verification_data = result
                    payment.save()
                
                return Response({
                    "success": True,
                    "payment_id": payment.id,
                    "amount": amount,
                    "status": payment.status,
                })
                
        except Exception as e:
            logger.error(f"Payment record creation failed: {e}")
            return Response({"error": "Failed to record payment"}, status=500)


class PaystackWebhook(APIView):
    """
    Handle Paystack webhook events.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        from core.payment_utils import get_paystack_service, PaystackError
        
        # Verify webhook signature
        signature = request.headers.get("x-paystack-signature")
        if not signature:
            return Response({"error": "No signature"}, status=400)
        
        # Get raw body
        body = request.body
        
        try:
            paystack = get_paystack_service()
            if not PaystackService.verify_webhook_signature(
                body,
                signature,
                paystack.webhook_secret
            ):
                return Response({"error": "Invalid signature"}, status=401)
        except Exception:
            pass  # Skip verification if not configured
        
        # Parse event
        import json
        try:
            event = json.loads(body)
        except:
            return Response({"error": "Invalid JSON"}, status=400)
        
        event_type = event.get("event")
        data = event.get("data", {})
        
        logger.info(f"Paystack webhook: {event_type}")
        
        if event_type == "charge.success":
            reference = data.get("reference")
            status = data.get("status")
            
            if status == "success":
                # Update payment record
                try:
                    payment = Payment.objects.get(gateway_reference=reference)
                    payment.status = "completed"
                    payment.verification_data = data
                    payment.save()
                    logger.info(f"Payment confirmed: {reference}")
                except Payment.DoesNotExist:
                    logger.warning(f"Payment not found: {reference}")
        
        return Response({"status": "received"})


class ExpenseViewSet(TenantViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        school = get_request_school(self.request)
        session, term = _resolve_period_filters(self.request, school)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        return qs


class AdmissionPackageViewSet(TenantViewSet):
    queryset = AdmissionPackage.objects.all()
    serializer_class = AdmissionPackageSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


# ==========================================
# PAYROLL VIEWSETS
# ==========================================


class SalaryAllowanceViewSet(TenantViewSet):
    queryset = SalaryAllowance.objects.all()
    serializer_class = SalaryAllowanceSerializer
    pagination_class = StandardPagination


class SalaryDeductionViewSet(TenantViewSet):
    queryset = SalaryDeduction.objects.all()
    serializer_class = SalaryDeductionSerializer
    pagination_class = StandardPagination


class StaffSalaryStructureViewSet(TenantViewSet):
    queryset = StaffSalaryStructure.objects.select_related("staff").all()
    serializer_class = StaffSalaryStructureSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=["get"])
    def by_staff(self, request):
        staff_id = request.query_params.get("staff_id")
        if not staff_id:
            return Response({"error": "Staff ID required"}, status=400)

        structure, created = StaffSalaryStructure.objects.get_or_create(
            staff_id=staff_id, school=get_request_school(request)
        )
        # Recalculate just in case basic salary changed
        structure.calculate_totals()
        return Response(self.get_serializer(structure).data)


class PayrollViewSet(TenantViewSet):
    queryset = Payroll.objects.prefetch_related("entries", "entries__staff").all()
    serializer_class = PayrollSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """
        Generate Draft Payroll for a given month.
        Requires: month (YYYY-MM-DD)
        """
        month_str = request.data.get("month")
        if not month_str:
            return Response({"error": "Month is required"}, status=400)

        # Parse month to first day
        from datetime import datetime

        try:
            date_obj = datetime.strptime(month_str, "%Y-%m-%d").date()
            month_start = date_obj.replace(day=1)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        # Check if exists
        if Payroll.objects.filter(school=school, month=month_start).exists():
            return Response({"error": f"Payroll for {month_start.strftime('%B %Y')} already exists."}, status=400)

        payroll = Payroll.objects.create(school=school, month=month_start, status="draft")

        # Fetch active staff with pre-fetched salary structure
        active_staff = Teacher.objects.filter(school=school).select_related("salary_structure")

        # Ensure all active staff have a salary structure (Bulk Create if missing)
        staff_without_structure = [s.id for s in active_staff if not hasattr(s, "salary_structure")]
        if staff_without_structure:
            StaffSalaryStructure.objects.bulk_create(
                [StaffSalaryStructure(staff_id=sid, school=school) for sid in staff_without_structure]
            )
            # Re-fetch to include the newly created structures
            active_staff = Teacher.objects.filter(school=school).select_related("salary_structure")

        total_bill = 0
        count = 0
        entries_to_create = []

        for staff in active_staff:
            structure = staff.salary_structure
            data = structure.structure_data or {}

            # In-memory calculation instead of calling calculate_totals() which triggers a save()
            allowances = sum(float(x.get("amount", 0)) for x in data.get("allowances", []))
            deductions = sum(float(x.get("amount", 0)) for x in data.get("deductions", []))

            basic = float(staff.basic_salary) if staff.basic_salary else 0
            net = basic + allowances - deductions

            # Keep values for later bulk creation
            entries_to_create.append(
                PayrollEntry(
                    school=school,
                    payroll=payroll,
                    staff=staff,
                    basic_salary=basic,
                    total_allowances=allowances,
                    total_deductions=deductions,
                    net_pay=net,
                    breakdown=data,
                )
            )

            total_bill += net
            count += 1

        # Bulk create all payroll entries in one query
        PayrollEntry.objects.bulk_create(entries_to_create)

        payroll.total_wage_bill = total_bill
        payroll.total_staff = count
        payroll.save()

        return Response(self.get_serializer(payroll).data, status=201)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != "draft":
            return Response({"error": "Only draft payrolls can be approved"}, status=400)

        payroll.status = "approved"
        payroll.approved_by = request.user
        payroll.approved_at = timezone.now()
        payroll.save()

        return Response(self.get_serializer(payroll).data)

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != "approved":
            return Response({"error": "Payroll must be approved before payment"}, status=400)

        payroll.status = "paid"
        payroll.paid_at = timezone.now()
        payroll.save()

        # Auto-create Expense Check
        create_expense = request.data.get("create_expense", False)
        if create_expense:
            # Use payroll's school for session/term lookup (not request.user.school)
            from schools.models import SchoolSettings

            school_settings = SchoolSettings.objects.filter(school=payroll.school).first()
            Expense.objects.create(
                school=payroll.school,
                title=f"Staff Payroll - {payroll.month.strftime('%B %Y')}",
                amount=payroll.total_wage_bill,
                category="salary",
                date=timezone.now().date(),
                session=school_settings.current_session if school_settings else "",
                term=school_settings.current_term if school_settings else "",
                recorded_by=request.user.username,
                description=f"Automated payroll entry for {payroll.total_staff} staff.",
            )

        return Response(self.get_serializer(payroll).data)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        session, term = _resolve_period_filters(request, school)

        # Simple aggregated stats
        expected_fees = calculate_expected_revenue(school, session=session, term=term)
        financial_filters = {"school": school}
        if session:
            financial_filters["session"] = session
        if term:
            financial_filters["term"] = term

        total_collected = Payment.objects.filter(**financial_filters).aggregate(Sum("amount"))["amount__sum"] or 0
        total_expenses = Expense.objects.filter(**financial_filters).aggregate(Sum("amount"))["amount__sum"] or 0

        # Payroll stats
        total_payroll = (
            Payroll.objects.filter(school=school, status="paid").aggregate(
                total=Coalesce(Sum("total_wage_bill"), Value(0), output_field=DecimalField())
            )["total"]
            or 0
        )

        # Outstanding
        outstanding = expected_fees - total_collected

        # Recent activity
        recent_payments = Payment.objects.filter(**financial_filters).order_by("-date")[:5]
        recent_expenses = Expense.objects.filter(**financial_filters).order_by("-date")[:5]

        data = {
            "expected_revenue": expected_fees,
            "total_collected": total_collected,
            "total_outstanding": outstanding,
            "total_expenses": total_expenses,
            "total_payroll": total_payroll,
            "net_balance": total_collected - total_expenses - total_payroll,
            "recent_payments": PaymentSerializer(recent_payments, many=True).data,
            "recent_expenses": ExpenseSerializer(recent_expenses, many=True).data,
        }

        return Response(data)

    @action(detail=False, methods=["get"], url_path="financial-stats")
    def financial_stats(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        session, term = _resolve_period_filters(request, school)

        # Filter by session/term if provided
        filters = {"school": school}
        if session:
            filters["session"] = session
        if term:
            filters["term"] = term

        expected_fees = calculate_expected_revenue(school, session=session, term=term)

        total_collected = Payment.objects.filter(**filters).aggregate(Sum("amount"))["amount__sum"] or 0
        total_expenses = Expense.objects.filter(**filters).aggregate(Sum("amount"))["amount__sum"] or 0

        # Payroll stats (approximate based on session/term as payroll is monthly)
        total_payroll = (
            Payroll.objects.filter(school=school, status="paid").aggregate(
                total=Coalesce(Sum("total_wage_bill"), Value(0), output_field=DecimalField())
            )["total"]
            or 0
        )

        # Outstanding
        outstanding = expected_fees - total_collected

        data = {
            "expected_revenue": float(expected_fees),
            "total_collected": float(total_collected),
            "total_outstanding": float(outstanding),
            "total_expenses": float(total_expenses),
            "net_balance": float(total_collected - total_expenses - total_payroll),
        }

        return Response(data)

    @action(detail=False, methods=["get"], url_path="revenue-summary")
    def revenue_summary(self, request):
        school = get_request_school(request)
        term_id = request.query_params.get("term_id")
        
        if term_id:
            term = AcademicTerm.objects.filter(school=school, id=term_id).first()
        else:
            term = AcademicTerm.objects.filter(school=school, is_current=True).first()

        if not term:
            return Response({"error": "Academic term not found"}, status=404)

        # 1. EXPECTED REVENUE CALCULATION
        # Phase A: Get all fee items for this term
        fee_items = FeeItem.objects.filter(school=school, session=term.session, term=term.name, active=True)
        
        total_expected = 0
        for item in fee_items:
            # Count target students
            student_query = Q(school=school, status="active")
            if item.target_class:
                student_query &= Q(current_class=item.target_class)
            
            student_count = Student.objects.filter(student_query).count()
            total_expected += (item.amount * student_count)

        # Phase B: Subtract individual discounts
        total_discounts = StudentFee.objects.filter(
            school=school, 
            fee_item__session=term.session, 
            fee_item__term=term.name
        ).aggregate(Sum("discount_amount"))["discount_amount__sum"] or 0
        
        net_expected = total_expected - total_discounts

        # 2. COLLECTED REVENUE
        collected = Payment.objects.filter(
            school=school, 
            session=term.session, 
            term=term.name, 
            status="completed"
        ).aggregate(Sum("amount"))["amount__sum"] or 0

        # 3. FORECASTING logic
        from datetime import date
        today = timezone.now().date()
        
        days_elapsed = (today - term.start_date).days
        days_total = (term.end_date - term.start_date).days
        
        # Max out elapsed days at total days if term has ended
        days_elapsed = max(0, min(days_elapsed, days_total))
        
        # 3. FORECASTING logic - optimistic fallback if term just started or no data yet
        if days_elapsed >= 7 and collected > 0:
            pace = collected / days_elapsed
            forecast = pace * days_total
        else:
            # At start of term, we assume full potential collection is still possible
            forecast = net_expected

        outstanding = net_expected - collected
        collection_rate = (collected / net_expected * 100) if net_expected > 0 else 0

        return Response({
            "term": {
                "id": term.id,
                "name": term.name,
                "session": term.session,
                "start_date": term.start_date,
                "end_date": term.end_date,
            },
            "expected": float(net_expected),
            "collected": float(collected),
            "outstanding": float(outstanding),
            "forecast": float(round(forecast, 2)),
            "collection_rate": round(float(collection_rate), 1),
            "days_elapsed": days_elapsed,
            "days_total": days_total
        })

    @action(detail=False, methods=["get"], url_path="revenue-chart")
    def revenue_chart(self, request):
        school = get_request_school(request)
        term_id = request.query_params.get("term_id")
        
        if term_id:
            term = AcademicTerm.objects.filter(school=school, id=term_id).first()
        else:
            term = AcademicTerm.objects.filter(school=school, is_current=True).first()

        if not term:
            return Response({"error": "Academic term not found"}, status=404)

        # Generate labels (Weekly)
        from datetime import timedelta
        labels = []
        expected_points = []
        collected_points = []
        forecast_points = []
        
        # Calculate full expected revenue (static baseline)
        fee_items = FeeItem.objects.filter(school=school, session=term.session, term=term.name, active=True)
        total_expected = 0
        for item in fee_items:
            student_query = Q(school=school, status="active")
            if item.target_class:
                student_query &= Q(current_class=item.target_class)
            student_count = Student.objects.filter(student_query).count()
            total_expected += (item.amount * student_count)
        
        total_discounts = StudentFee.objects.filter(
            school=school, 
            fee_item__session=term.session, 
            fee_item__term=term.name
        ).aggregate(Sum("discount_amount"))["discount_amount__sum"] or 0
        net_expected = float(total_expected - total_discounts)

        # Weekly aggregation
        curr_date = term.start_date
        cumulative_collected = 0
        today = timezone.now().date()
        
        week_num = 1
        while curr_date <= term.end_date:
            next_date = curr_date + timedelta(days=7)
            labels.append(f"Week {week_num}")
            
            # Static expected baseline
            expected_points.append(net_expected)
            
            # Sum payments in this range
            period_collected = Payment.objects.filter(
                school=school,
                session=term.session,
                term=term.name,
                status="completed",
                date__gte=curr_date,
                date__lt=next_date
            ).aggregate(Sum("amount"))["amount__sum"] or 0
            
            # Update cumulative (only for past/current weeks)
            if curr_date <= today:
                cumulative_collected += float(period_collected)
                collected_points.append(cumulative_collected)
            else:
                # Future weeks don't have actual collections yet
                collected_points.append(None)

            # Advance
            curr_date = next_date
            week_num += 1

        # Forecast Projection (Starts from current cumulative collected)
        days_elapsed = (today - term.start_date).days
        days_total = (term.end_date - term.start_date).days
        
        current_collected = collected_points[min(len(collected_points)-1, (days_elapsed // 7))] if days_elapsed >= 0 else 0
        
        # Use simple linear pace, fallback to static baseline if term just started
        if days_elapsed >= 7 and current_collected > 0:
            pace_per_week = (current_collected / (days_elapsed / 7))
        else:
            # Linear projection towards net_expected
            pace_per_week = net_expected / (days_total / 7) if days_total > 0 else 0
        
        for i in range(len(labels)):
            if (i * 7) < days_elapsed:
                forecast_points.append(collected_points[i])
            else:
                # Project forward
                projected = current_collected + (pace_per_week * (i - (days_elapsed // 7)))
                # Clamp forecast to not exceed 120% of expected revenue (realistic buffer)
                forecast_points.append(min(round(projected, 2), float(net_expected * 1.2)))

        return Response({
            "labels": labels,
            "expected": expected_points,
            "collected": collected_points,
            "forecast": forecast_points
        })


class DiscountViewSet(TenantViewSet):
    queryset = FeeDiscount.objects.all()
    serializer_class = FeeDiscountSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=["post"], url_path="bulk")
    def apply_bulk(self, request):
        """
        Apply bulk discount.
        """
        scope = request.data.get("scope")
        fee_item_id = request.data.get("fee_item")
        discount_type = request.data.get("discount_type")
        value = request.data.get("value", 0)
        reason = request.data.get("reason", "")
        override = request.data.get("override", False)

        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        count = apply_bulk_discount(
            school=school,
            scope=scope,
            fee_item_id=fee_item_id,
            discount_type=discount_type,
            value=value,
            reason=reason,
            applied_by=request.user,
            override=override
        )

        return Response({
            "success": True,
            "message": f"Successfully applied discounts to {count} students",
            "count": count
        })

    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request):
        """
        Preview financial impact of bulk discount.
        """
        scope = request.data.get("scope")
        fee_item_id = request.data.get("fee_item")
        discount_type = request.data.get("discount_type")
        value = request.data.get("value", 0)

        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        preview_data = preview_bulk_discount(
            school=school,
            scope=scope,
            fee_item_id=fee_item_id,
            discount_type=discount_type,
            value=value
        )

        return Response(preview_data)
