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
    attachment_url = models.CharField(max_length=500, blank=True, default='', help_text="URL to an attached file (uploaded via FileUploadView)")
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


class Notification(models.Model):
    """Per-user in-app notifications (assignment posted, fee recorded, etc.)"""
    CATEGORY_CHOICES = (
        ('academic', 'Academic'),
        ('bursary', 'Bursary'),
        ('attendance', 'Attendance'),
        ('announcement', 'Announcement'),
        ('system', 'System'),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='system')
    link = models.CharField(max_length=500, blank=True, default='', help_text="Deep link path e.g. /dashboard/reports")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['school', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.category}] {self.title} → {self.user.username}"


class SchoolAnnouncement(models.Model):
    """School-specific announcements"""
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('important', 'Important'),
        ('urgent', 'Urgent'),
    )
    TARGET_CHOICES = (
        ('all', 'Everyone'),
        ('class', 'Specific Class'),
        ('parents', 'Parents Only'),
        ('teachers', 'Teachers Only'),
        ('staff', 'Staff Only'),
    )

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='school_announcements')
    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    target = models.CharField(max_length=20, choices=TARGET_CHOICES, default='all')
    class_id = models.CharField(max_length=100, blank=True, null=True, help_text="Specific class ID if target is 'class'")
    
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='authored_announcements')
    author_role = models.CharField(max_length=50, blank=True)
    
    is_pinned = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['school', 'is_active']),
            models.Index(fields=['target', 'class_id']),
        ]

    def __str__(self):
        return f"[{self.school.name}] {self.title}"

class Newsletter(models.Model):
    """School newsletters (PDF uploads)"""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='newsletters')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file_data = models.TextField(help_text="Base64 encoded PDF or URL")
    file_name = models.CharField(max_length=255, default='newsletter.pdf')
    
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)
    
    published_by = models.CharField(max_length=100, blank=True)
    is_published = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'is_published']),
            models.Index(fields=['session', 'term']),
        ]

    def __str__(self):
        return f"[{self.school.name}] {self.title} - {self.term} {self.session}"
