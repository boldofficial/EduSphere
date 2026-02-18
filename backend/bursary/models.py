from django.db import models
from academic.models import TenantModel, Class, Student, Teacher
from schools.models import School
from django.utils import timezone

class FeeCategory(TenantModel):
    """
    Categories like Tuition, Uniform, Transport, Books etc.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_optional = models.BooleanField(default=False) # If true, must be explicitly assigned to student
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"

class Scholarship(TenantModel):
    """
    Standard scholarship types (e.g. Full Scholarship, Sports Waiver)
    """
    TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount')
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    benefit_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='percentage')
    value = models.DecimalField(max_digits=10, decimal_places=2) # 100.00 for 100% or 5000 for NGN 5000
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.school.name})"

class FeeItem(TenantModel):
    """
    Specific fee amount for a session/term/class.
    E.g. Year 1 Tuition for 2025/2026 First Term = 50,000
    """
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='items')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    session = models.CharField(max_length=50) # e.g. "2025/2026"
    term = models.CharField(max_length=50)    # e.g. "First Term"
    
    # Target Audience (can be specific class or all)
    target_class = models.ForeignKey(Class, on_delete=models.CASCADE, null=True, blank=True, related_name='fees')
    
    active = models.BooleanField(default=True)

    def __str__(self):
        target = self.target_class.name if self.target_class else "All Classes"
        return f"{self.category.name} - {target} - {self.amount}"

class StudentFee(TenantModel):
    """
    Linking a fee to a student. Most fees are automatic via Class, 
    but this handles:
    1. Optional fees (Bus, Party)
    2. Customized discounts/waivers
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_fees_rel')
    fee_item = models.ForeignKey(FeeItem, on_delete=models.CASCADE, related_name='student_allocations')
    scholarship = models.ForeignKey(Scholarship, on_delete=models.SET_NULL, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    class Meta:
        unique_together = ('student', 'fee_item')

    def __str__(self):
        return f"{self.student.names} -> {self.fee_item}"

class Payment(TenantModel):
    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('transfer', 'Bank Transfer'),
        ('pos', 'POS'),
        ('online', 'Online Payment')
    )

    STATUS_CHOICES = (
        ('pending', 'Pending Verification'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded')
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.now)
    reference = models.CharField(max_length=100, unique=True) # Receipt No or Gateway Reference
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    gateway_reference = models.CharField(max_length=100, blank=True, null=True)
    verification_data = models.JSONField(null=True, blank=True) # Data from Paystack/Flutterwave
    
    category = models.ForeignKey(FeeCategory, on_delete=models.SET_NULL, null=True, blank=True)
    remark = models.TextField(blank=True)
    recorded_by = models.CharField(max_length=100, help_text="User who entered this record")

    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Recpt#{self.reference} - {self.student.names} - {self.amount}"

class PaymentLineItem(TenantModel):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='line_items')
    purpose = models.CharField(max_length=100) # e.g. "Tuition", "Uniform"
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.purpose}: {self.amount}"

class Expense(TenantModel):
    """
    Track money going OUT of the school
    """
    CATEGORY_CHOICES = (
        ('salary', 'Salary'),
        ('maintenance', 'Maintenance'),
        ('supplies', 'Supplies'),
        ('utilities', 'Utilities'),
        ('other', 'Other')
    )

    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    recorded_by = models.CharField(max_length=100)
    
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.title} - {self.amount}"

class AdmissionPackage(TenantModel):
    """
    Bundles specific fees for an admission intake.
    """
    intake = models.OneToOneField('academic.AdmissionIntake', on_delete=models.CASCADE, related_name='package')
    fees = models.ManyToManyField(FeeItem, related_name='admission_packages')

    def __str__(self):
        return f"Package for {self.intake.name}"

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
    Links a Teacher to specific Allowances/Deductions 
    that apply every month.
    """
    staff = models.OneToOneField(Teacher, on_delete=models.CASCADE, related_name='salary_structure')
    
    # Store dynamic structure as JSON:
    # {
    #   "allowances": [ {"id": 1, "name": "Transport", "amount": 5000}, ... ],
    #   "deductions": [ {"id": 2, "name": "Union Fee", "amount": 1000}, ... ]
    # }
    structure_data = models.JSONField(default=dict, blank=True)
    
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Pre-calculated Net for preview
    # (Basic + total_allowances - total_deductions)
    net_salary_preview = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def calculate_totals(self):
        data = self.structure_data or {}
        allowances = sum(float(x.get('amount', 0)) for x in data.get('allowances', []))
        deductions = sum(float(x.get('amount', 0)) for x in data.get('deductions', []))
        self.total_allowances = allowances
        self.total_deductions = deductions
        
        basic = float(self.staff.basic_salary) if self.staff.basic_salary else 0
        self.net_salary_preview = basic + allowances - deductions
        self.save()

    def __str__(self):
        return f"Structure - {self.staff.name}"

class Payroll(TenantModel):
    """
    Represents a monthly payroll run for the entire school
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
    )
    month = models.DateField(help_text="First day of the month (e.g. 2025-10-01)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    total_wage_bill = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_staff = models.IntegerField(default=0)
    
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payrolls')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-month']
        unique_together = ('school', 'month')

    def __str__(self):
        return f"Payroll {self.month.strftime('%B %Y')} - {self.status}"

class PayrollEntry(TenantModel):
    """
    The calculated payslip for one staff member for one Payroll run.
    Snapshot of data at the time of generation.
    """
    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='entries')
    staff = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='payslips')
    
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
    
    class Meta:
        unique_together = ('payroll', 'staff')

    def __str__(self):
        return f"{self.staff.name} - {self.payroll.month.strftime('%b %Y')}"
