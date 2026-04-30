from rest_framework import serializers

from academic.models import Teacher
from core.tenant_utils import get_request_school
from .models import (
    Payroll,
    PayrollEntry,
    SalaryAllowance,
    SalaryDeduction,
    StaffSalaryStructure,
)


def _school_from_request(serializer):
    request = serializer.context.get("request")
    if not request:
        return None
    try:
        return get_request_school(request, allow_super_admin_tenant=True)
    except Exception:
        return None


# ==========================================
# SALARY COMPONENT SERIALIZERS
# ==========================================

class SalaryAllowanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryAllowance
        fields = "__all__"
        read_only_fields = ("school",)


class SalaryDeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryDeduction
        fields = "__all__"
        read_only_fields = ("school",)


# ==========================================
# SALARY STRUCTURE SERIALIZER
# ==========================================

class StaffSalaryStructureSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.name", read_only=True)
    staff_role = serializers.CharField(source="staff.role", read_only=True)
    staff_type = serializers.CharField(source="staff.staff_type", read_only=True)
    employment_type = serializers.CharField(source="staff.employment_type", read_only=True)
    basic_salary = serializers.DecimalField(
        source="staff.basic_salary", max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = StaffSalaryStructure
        fields = [
            "id",
            "staff",
            "staff_name",
            "staff_role",
            "staff_type",
            "employment_type",
            "basic_salary",
            "structure_data",
            "total_allowances",
            "total_deductions",
            "net_salary_preview",
        ]
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["staff"].queryset = Teacher.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        staff = attrs.get("staff")
        if school and staff and staff.school != school:
            raise serializers.ValidationError({"staff": "Staff must belong to your school."})
        return attrs

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.calculate_totals()  # Auto-recalc totals on save
        return instance


# ==========================================
# PAYROLL ENTRY (PAYSLIP) SERIALIZER
# ==========================================

class PayrollEntrySerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.name", read_only=True)
    staff_role = serializers.CharField(source="staff.role", read_only=True)
    staff_type = serializers.CharField(source="staff.staff_type", read_only=True)
    staff_id_display = serializers.IntegerField(source="staff.id", read_only=True)
    bank_name = serializers.CharField(source="staff.bank_name", read_only=True)
    account_number = serializers.CharField(source="staff.account_number", read_only=True)
    account_name = serializers.CharField(source="staff.account_name", read_only=True)
    payroll_month = serializers.DateField(source="payroll.month", read_only=True)
    payroll_status = serializers.CharField(source="payroll.status", read_only=True)

    class Meta:
        model = PayrollEntry
        fields = [
            "id",
            "payroll",
            "staff",
            "staff_name",
            "staff_role",
            "staff_type",
            "staff_id_display",
            "payslip_number",
            "bank_name",
            "account_number",
            "account_name",
            "basic_salary",
            "total_allowances",
            "total_deductions",
            "net_pay",
            "breakdown",
            "is_paid",
            "payment_date",
            "payroll_month",
            "payroll_status",
        ]
        read_only_fields = ("school",)


# ==========================================
# PAYROLL RUN SERIALIZER
# ==========================================

class PayrollSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source="generated_by.username", read_only=True, default="")
    approver_name = serializers.CharField(source="approved_by.username", read_only=True, default="")
    entries = PayrollEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Payroll
        fields = [
            "id",
            "month",
            "status",
            "notes",
            "total_wage_bill",
            "total_staff",
            "generated_by",
            "generated_by_name",
            "approved_by",
            "approver_name",
            "approved_at",
            "paid_at",
            "entries",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("school", "generated_by", "approved_by", "approved_at", "paid_at")
