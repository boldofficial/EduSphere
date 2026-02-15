from django.db import models
from academic.models import TenantModel, Class, Student
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
