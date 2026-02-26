from django.db import models
from django.utils.text import slugify

class EmailTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Unique identifier for the template (e.g., 'welcome_email')")
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    subject = models.CharField(max_length=255)
    body_html = models.TextField(help_text="The HTML content of the email. Use {{ variable }} for dynamic data.")
    body_text = models.TextField(blank=True, help_text="Plain text version for better deliverability.")
    variables = models.JSONField(default=dict, help_text="List of available variables for this template (e.g., {'user_name': 'John Doe'})")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class EmailCampaign(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sending', 'Sending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    title = models.CharField(max_length=255)
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    custom_subject = models.CharField(max_length=255, blank=True, null=True)
    custom_body = models.TextField(blank=True, null=True, help_text="Custom HTML body if not using a template")
    
    # Audience filters
    audience_filter = models.JSONField(default=dict, blank=True, help_text="Filters applied to select recipients (e.g. {'role': 'SCHOOL_ADMIN'})")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class EmailLog(models.Model):
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('queued', 'Queued'),
    )

    recipient = models.EmailField()
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    campaign = models.ForeignKey(EmailCampaign, on_delete=models.CASCADE, null=True, blank=True, related_name='logs')
    subject = models.CharField(max_length=255, blank=True, default='') # Actual subject sent
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Email to {self.recipient} - {self.status}"
