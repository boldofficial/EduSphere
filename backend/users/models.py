from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from schools.models import School

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
        SCHOOL_ADMIN = 'SCHOOL_ADMIN', 'School Admin'
        TEACHER = 'TEACHER', 'Teacher'
        STUDENT = 'STUDENT', 'Student'
        PARENT = 'PARENT', 'Parent'
        STAFF = 'STAFF', 'Staff'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    
    # Additional fields can be added here
    
    def __str__(self):
        return f"{self.username} - {self.role} ({self.school})"
