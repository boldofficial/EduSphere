from django.db import models
from academic.models import Teacher, TenantModel

# ==========================================
# PAYROLL SYSTEM MODELS
# ==========================================

class SalaryAllowance(TenantModel):
    """
    Master list of allowance types (e.g. Transport, Housing, Hazard)
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_taxable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.school.name})"


class SalaryDeduction(TenantModel):
    """
    Master list of deduction types (e.g. Tax, Loan, Union Dues)
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_statutory = models.BooleanField(default=False, help_text="Is this required by law? (e.g. Tax/Pension)")

    def __str__(self):
        return f"{self.name} ({self.school.name})"


class StaffSalaryStructure(TenantModel):
    """
    Links a Teacher/Staff member to specific Allowances/Deductions
    that apply every month.
    """

    staff = models.OneToOneField(Teacher, on_delete=models.CASCADE, related_name="salary_structure")

    # Store dynamic structure as JSON:
    # {
    #   "allowances": [ {"id": 1, "name": "Transport", "amount": 5000, "type": "fixed"}, ... ],
    #   "deductions": [ {"id": 2, "name": "Union Fee", "amount": 1000, "type": "fixed"}, ... ]
    # }
    # type can be "fixed" (flat amount) or "percentage" (of basic salary)
    structure_data = models.JSONField(default=dict, blank=True)

    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Pre-calculated Net for preview
    # (Basic + total_allowances - total_deductions)
    net_salary_preview = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def calculate_totals(self):
        data = self.structure_data or {}
        basic = float(self.staff.basic_salary) if self.staff.basic_salary else 0

        allowances = 0
        for item in data.get("allowances", []):
            if item.get("type") == "percentage":
                allowances += basic * (float(item.get("value", 0)) / 100)
            else:
                allowances += float(item.get("amount", 0))

        deductions = 0
        for item in data.get("deductions", []):
            if item.get("type") == "percentage":
                deductions += basic * (float(item.get("value", 0)) / 100)
            else:
                deductions += float(item.get("amount", 0))

        self.total_allowances = allowances
        self.total_deductions = deductions
        self.net_salary_preview = basic + allowances - deductions
        self.save()

    def __str__(self):
        return f"Structure - {self.staff.name}"


class Payroll(TenantModel):
    """
    Represents a monthly payroll run for the entire school.
    Workflow: Draft → Approved → Paid
    """

    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("approved", "Approved"),
        ("paid", "Paid"),
    )
    month = models.DateField(help_text="First day of the month (e.g. 2025-10-01)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    notes = models.TextField(blank=True, help_text="Admin remarks for this payroll run")

    total_wage_bill = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_staff = models.IntegerField(default=0)

    generated_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="generated_payrolls"
    )
    approved_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_payrolls"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-month"]
        unique_together = (("school", "month"),)

    def __str__(self):
        return f"Payroll {self.month.strftime('%B %Y')} - {self.status}"


class PayrollEntry(TenantModel):
    """
    The calculated payslip for one staff member for one Payroll run.
    Snapshot of data at the time of generation.
    """

    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name="entries")
    staff = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="payslips")

    # Unique payslip reference number e.g. PSL-202604-001
    payslip_number = models.CharField(max_length=30, blank=True, db_index=True)

    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)

    # Detailed breakdown for the payslip view
    # {
    #   "allowances": [ {"name": "Transport", "amount": 5000}, ... ],
    #   "deductions": [ {"name": "Tax", "amount": 2000}, ... ],
    #   "bank": { "name": "GTB", "account": "123..." }
    # }
    breakdown = models.JSONField(default=dict)

    is_paid = models.BooleanField(default=False)
    payment_date = models.DateField(null=True, blank=True, help_text="Date salary was disbursed")

    class Meta:
        unique_together = (("payroll", "staff"),)
        ordering = ["staff__name"]

    def generate_payslip_number(self):
        """Auto-generate sequential payslip number: PSL-YYYYMM-NNN"""
        if self.payslip_number:
            return self.payslip_number

        month_str = self.payroll.month.strftime("%Y%m")
        prefix = f"PSL-{month_str}-"

        # Get the highest existing number for this month
        last_entry = (
            PayrollEntry.objects.filter(
                school=self.school,
                payslip_number__startswith=prefix,
            )
            .order_by("-payslip_number")
            .first()
        )

        if last_entry and last_entry.payslip_number:
            try:
                last_num = int(last_entry.payslip_number.split("-")[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1

        self.payslip_number = f"{prefix}{next_num:03d}"
        return self.payslip_number

    def __str__(self):
        return f"{self.staff.name} - {self.payroll.month.strftime('%b %Y')}"
