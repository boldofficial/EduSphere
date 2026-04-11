from django.utils import timezone
from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, Value, When
from django.db.models.functions import Coalesce
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from academic.models import Teacher
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
)
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
    queryset = FeeCategory.objects.all()
    serializer_class = FeeCategorySerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class ScholarshipViewSet(TenantViewSet):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class FeeItemViewSet(TenantViewSet):
    queryset = FeeItem.objects.all()
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
            "expected_revenue": expected_fees,
            "total_collected": total_collected,
            "total_outstanding": outstanding,
            "total_expenses": total_expenses,
            "net_balance": total_collected - total_expenses - total_payroll,
        }

        return Response(data)
