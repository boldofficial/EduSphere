from django.db import models
from academic.models import TenantModel


class ImportJob(TenantModel):
    """Track bulk import jobs."""
    
    TYPE_CHOICES = (
        ("students", "Students"),
        ("teachers", "Teachers"),
        ("staff", "Staff"),
        ("fees", "Fee Items"),
        ("scores", "Subject Scores"),
        ("attendance", "Attendance"),
    )
    
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )
    
    import_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    file_name = models.CharField(max_length=255)
    file_url = models.CharField(max_length=512, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    success_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    
    # Results
    errors = models.JSONField(default=list, blank=True)
    created_by = models.CharField(max_length=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.import_type} - {self.file_name} ({self.status})"


class ImportRow(TenantModel):
    """Track individual rows in import."""
    
    job = models.ForeignKey(ImportJob, on_delete=models.CASCADE, related_name="rows")
    row_number = models.IntegerField()
    data = models.JSONField(default=dict)
    
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    error_message = models.TextField(blank=True)
    
    # Created entity reference
    entity_id = models.IntegerField(null=True, blank=True)
    entity_type = models.CharField(max_length=50, blank=True)
    
    class Meta:
        ordering = ["row_number"]
    
    def __str__(self):
        return f"Row {self.row_number}: {self.status}"