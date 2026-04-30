from datetime import datetime
from decimal import Decimal

from django.db.models import Sum, Count, Q, DecimalField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school
from academic.views.base import TenantViewSet
from academic.models import Teacher

from .models import (
    Payroll,
    PayrollEntry,
    SalaryAllowance,
    SalaryDeduction,
    StaffSalaryStructure,
)
from .serializers import (
    PayrollSerializer,
    PayrollEntrySerializer,
    SalaryAllowanceSerializer,
    SalaryDeductionSerializer,
    StaffSalaryStructureSerializer,
)


# ==========================================
# SALARY COMPONENT VIEWSETS
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


# ==========================================
# HR DASHBOARD VIEWSET
# ==========================================

class HRDashboardViewSet(TenantViewSet):
    """
    Provides HR-specific dashboard analytics.
    """
    queryset = Payroll.objects.none()
    serializer_class = PayrollSerializer

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        # Staff counts
        total_staff = Teacher.objects.filter(school=school).count()
        academic_staff = Teacher.objects.filter(school=school, staff_type="ACADEMIC").count()
        non_academic_staff = Teacher.objects.filter(school=school, staff_type="NON_ACADEMIC").count()

        # Total monthly salary obligation (sum of all basic salaries)
        monthly_basic = Teacher.objects.filter(school=school).aggregate(
            total=Coalesce(Sum("basic_salary"), Value(0), output_field=DecimalField())
        )["total"]

        # Last paid payroll
        last_paid = Payroll.objects.filter(school=school, status="paid").order_by("-month").first()

        # Year-to-date expenditure
        current_year = timezone.now().year
        ytd_expenditure = Payroll.objects.filter(
            school=school, status="paid", month__year=current_year
        ).aggregate(
            total=Coalesce(Sum("total_wage_bill"), Value(0), output_field=DecimalField())
        )["total"]

        # Payroll status counts
        payroll_counts = Payroll.objects.filter(school=school).values("status").annotate(
            count=Count("id")
        )
        status_map = {item["status"]: item["count"] for item in payroll_counts}

        # Pending payroll (draft)
        pending_payroll = Payroll.objects.filter(school=school, status="draft").first()

        data = {
            "total_staff": total_staff,
            "academic_staff": academic_staff,
            "non_academic_staff": non_academic_staff,
            "monthly_basic_total": float(monthly_basic),
            "last_paid_payroll": {
                "month": last_paid.month.isoformat() if last_paid else None,
                "total": float(last_paid.total_wage_bill) if last_paid else 0,
                "paid_at": last_paid.paid_at.isoformat() if last_paid and last_paid.paid_at else None,
            } if last_paid else None,
            "ytd_expenditure": float(ytd_expenditure),
            "payroll_status": {
                "draft": status_map.get("draft", 0),
                "approved": status_map.get("approved", 0),
                "paid": status_map.get("paid", 0),
            },
            "pending_payroll_id": pending_payroll.id if pending_payroll else None,
        }

        return Response(data)


# ==========================================
# PAYROLL VIEWSET
# ==========================================

class PayrollViewSet(TenantViewSet):
    queryset = Payroll.objects.prefetch_related("entries", "entries__staff").all()
    serializer_class = PayrollSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """
        Generate Draft Payroll for a given month.
        Requires: month (YYYY-MM-DD or YYYY-MM)
        """
        month_str = request.data.get("month")
        if not month_str:
            return Response({"error": "Month is required"}, status=400)

        # Parse month — accept YYYY-MM-DD or YYYY-MM
        try:
            if len(month_str) == 7:  # YYYY-MM format
                date_obj = datetime.strptime(month_str, "%Y-%m").date()
            else:
                date_obj = datetime.strptime(month_str, "%Y-%m-%d").date()
            month_start = date_obj.replace(day=1)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD or YYYY-MM"}, status=400)

        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        # Check if exists
        if Payroll.objects.filter(school=school, month=month_start).exists():
            return Response(
                {"error": f"Payroll for {month_start.strftime('%B %Y')} already exists."},
                status=400,
            )

        payroll = Payroll.objects.create(
            school=school,
            month=month_start,
            status="draft",
            generated_by=request.user,
        )

        # Fetch active staff with pre-fetched salary structure
        active_staff = Teacher.objects.filter(school=school).select_related("salary_structure")

        # Ensure all active staff have a salary structure (Bulk Create if missing)
        existing_staff_ids = set(
            StaffSalaryStructure.objects.filter(school=school).values_list("staff_id", flat=True)
        )
        staff_without_structure = [s.id for s in active_staff if s.id not in existing_staff_ids]

        if staff_without_structure:
            StaffSalaryStructure.objects.bulk_create(
                [StaffSalaryStructure(staff_id=sid, school=school) for sid in staff_without_structure]
            )
            # Re-fetch to include the newly created structures
            active_staff = Teacher.objects.filter(school=school).select_related("salary_structure")

        total_bill = Decimal("0")
        count = 0
        entries_to_create = []

        for staff_member in active_staff:
            try:
                structure = staff_member.salary_structure
            except StaffSalaryStructure.DoesNotExist:
                continue

            data = structure.structure_data or {}
            basic = Decimal(str(staff_member.basic_salary)) if staff_member.basic_salary else Decimal("0")

            # Calculate allowances (supports percentage-based)
            allowance_details = []
            total_allowances = Decimal("0")
            for item in data.get("allowances", []):
                if item.get("type") == "percentage":
                    amount = basic * Decimal(str(item.get("value", 0))) / Decimal("100")
                else:
                    amount = Decimal(str(item.get("amount", 0)))
                allowance_details.append({"name": item.get("name", ""), "amount": float(amount)})
                total_allowances += amount

            # Calculate deductions (supports percentage-based)
            deduction_details = []
            total_deductions = Decimal("0")
            for item in data.get("deductions", []):
                if item.get("type") == "percentage":
                    amount = basic * Decimal(str(item.get("value", 0))) / Decimal("100")
                else:
                    amount = Decimal(str(item.get("amount", 0)))
                deduction_details.append({"name": item.get("name", ""), "amount": float(amount)})
                total_deductions += amount

            net = basic + total_allowances - total_deductions

            entry = PayrollEntry(
                school=school,
                payroll=payroll,
                staff=staff_member,
                basic_salary=basic,
                total_allowances=total_allowances,
                total_deductions=total_deductions,
                net_pay=net,
                breakdown={
                    "allowances": allowance_details,
                    "deductions": deduction_details,
                    "bank": {
                        "name": staff_member.bank_name or "",
                        "account": staff_member.account_number or "",
                        "account_name": staff_member.account_name or "",
                    },
                },
            )
            entry.generate_payslip_number()
            entries_to_create.append(entry)

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

        # Mark all entries as paid
        payroll.entries.update(is_paid=True, payment_date=timezone.now().date())

        # Auto-create Expense
        create_expense = request.data.get("create_expense", False)
        if create_expense:
            from bursary.models import Expense
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

    @action(detail=True, methods=["get"], url_path="payslip/(?P<entry_id>[^/.]+)")
    def payslip_detail(self, request, pk=None, entry_id=None):
        """
        Returns detailed payslip data for a single entry, including school branding info.
        """
        payroll = self.get_object()
        try:
            entry = payroll.entries.select_related("staff").get(id=entry_id)
        except PayrollEntry.DoesNotExist:
            return Response({"error": "Payslip not found"}, status=404)

        from schools.models import SchoolSettings
        school_settings = SchoolSettings.objects.filter(school=payroll.school).first()

        entry_data = PayrollEntrySerializer(entry, context={"request": request}).data
        entry_data["school"] = {
            "name": payroll.school.name if payroll.school else "",
            "address": school_settings.school_address if school_settings else "",
            "email": school_settings.school_email if school_settings else "",
            "phone": school_settings.school_phone if school_settings else "",
            "logo": school_settings.logo_media if school_settings else None,
        }

        return Response(entry_data)
