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

class EmailLog(models.Model):
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('queued', 'Queued'),
    )

    recipient = models.EmailField()
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Email to {self.recipient} - {self.status}"
