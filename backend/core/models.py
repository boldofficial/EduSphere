from django.db import models
from django.conf import settings
from schools.models import School

class GlobalActivityLog(models.Model):
    ACTION_CHOICES = (
        ('SCHOOL_SIGNUP', 'School Signup'),
        ('PAYMENT_RECORDED', 'Payment Recorded'),
        ('ADMIN_IMPERSONATION', 'Admin Impersonation'),
        ('PLAN_CREATED', 'Plan Created'),
        ('PLAN_UPDATED', 'Plan Updated'),
        ('PLAN_DELETED', 'Plan Deleted'),
        ('SCHOOL_DELETED', 'School Deleted'),
        ('SCHOOL_SUSPENDED', 'School Suspended'),
        ('SCHOOL_ACTIVATED', 'School Activated'),
        ('RECORDS_MUTATED', 'Records Mutated'),
        ('SECURITY_ALERT', 'Security Alert'),
        ('EXPORT_DATA', 'Export Data'),
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
    )

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='platform_activities')
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.action} - {self.description[:50]}"

class PlatformAnnouncement(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='low')
    is_active = models.BooleanField(default=True)
    target_role = models.CharField(max_length=50, default='SCHOOL_ADMIN') # For now, targeting school admins
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class SchoolMessage(models.Model):
    """Direct messaging between users within a school"""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'recipient', 'is_read']),
            models.Index(fields=['school', 'sender']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"
