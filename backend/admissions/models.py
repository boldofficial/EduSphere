from django.db import models
from django.utils import timezone
from academic.models import TenantModel
from users.models import User

class AdmissionIntake(TenantModel):
    name = models.CharField(max_length=100)  # e.g. "Fall 2025"
    description = models.TextField(blank=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "academic_admissionintake"

    def __str__(self):
        return f"{self.name} ({self.school.name})"


class Admission(TenantModel):
    intake = models.ForeignKey(
        AdmissionIntake, on_delete=models.CASCADE, related_name="applications", null=True, blank=True
    )
    child_name = models.CharField(max_length=255)
    child_dob = models.DateField(default=timezone.now)
    child_gender = models.CharField(max_length=10, choices=[("Male", "Male"), ("Female", "Female")])
    previous_school = models.CharField(max_length=255, blank=True)
    program = models.CharField(max_length=50)  # 'creche', 'pre-school', 'primary'
    class_applied = models.CharField(max_length=100)

    parent_name = models.CharField(max_length=255)
    parent_email = models.EmailField()
    parent_phone = models.CharField(max_length=50)
    parent_address = models.TextField()
    relationship = models.CharField(
        max_length=20, choices=[("Father", "Father"), ("Mother", "Mother"), ("Guardian", "Guardian")]
    )

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    # Store IDs of selected FeeItems (e.g. [1, 4, 10]) from the AdmissionPackage
    selected_package_items = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "academic_admission"

    def __str__(self):
        return f"{self.child_name} - {self.intake.name if self.intake else 'No Intake'}"
