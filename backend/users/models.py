from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from schools.models import School


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        SCHOOL_ADMIN = "SCHOOL_ADMIN", "School Admin"
        TEACHER = "TEACHER", "Teacher"
        STUDENT = "STUDENT", "Student"
        PARENT = "PARENT", "Parent"
        STAFF = "STAFF", "Staff"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name="users")

    # Two-Factor Authentication fields
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)  # For TOTP
    two_factor_backup_codes = models.JSONField(default=list, blank=True)  # Backup codes
    phone_number = models.CharField(max_length=20, blank=True)  # For SMS 2FA

    # Additional fields can be added here

    def __str__(self):
        return f"{self.username} - {self.role} ({self.school})"

    def generate_backup_codes(self):
        """Generate 8 backup codes for 2FA recovery"""
        import secrets
        codes = [secrets.token_hex(4).upper() for _ in range(8)]
        self.two_factor_backup_codes = codes
        return codes

    def verify_backup_code(self, code):
        """Verify a backup code and remove it if valid"""
        if not self.two_factor_backup_codes:
            return False
        
        code = code.upper()
        if code in self.two_factor_backup_codes:
            # Remove used code
            codes = self.two_factor_backup_codes
            codes.remove(code)
            self.two_factor_backup_codes = codes
            self.save(update_fields=['two_factor_backup_codes'])
            return True
        return False
