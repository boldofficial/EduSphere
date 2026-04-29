from django.db import models
from academic.models import Class, Student, Teacher, TenantModel


class BookCategory(TenantModel):
    """Library book categories."""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="subcategories")
    
    def __str__(self):
        return self.name


class Book(TenantModel):
    """Library book catalog."""
    
    isbn = models.CharField(max_length=20, blank=True, unique=True, null=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    publisher = models.CharField(max_length=255, blank=True)
    year_published = models.IntegerField(null=True, blank=True)
    edition = models.CharField(max_length=50, blank=True)
    
    category = models.ForeignKey(BookCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="books")
    
    # Physical details
    shelf_location = models.CharField(max_length=100, blank=True, help_text="e.g., Shelf A-2")
    copy_number = models.CharField(max_length=20, blank=True)
    
    # Status
    STATUS_CHOICES = (
        ("available", "Available"),
        ("borrowed", "Borrowed"),
        ("reserved", "Reserved"),
        ("lost", "Lost"),
        ("damaged", "Damaged"),
        ("withdrawn", "Withdrawn"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    
    # Counts
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)
    
    # Description
    description = models.TextField(blank=True)
    cover_image = models.CharField(max_length=512, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["title"]
    
    def __str__(self):
        return f"{self.title} by {self.author}"


class BorrowRecord(TenantModel):
    """Track book borrowing and returns."""
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrow_records")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="borrow_records")
    
    # Dates
    borrow_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    
    # Status
    STATUS_CHOICES = (
        ("borrowed", "Borrowed"),
        ("returned", "Returned"),
        ("overdue", "Overdue"),
        ("lost", "Lost"),
        ("renewed", "Renewed"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="borrowed")
    
    # Fine
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fine_paid = models.BooleanField(default=False)
    
    # Notes
    notes = models.TextField(blank=True)
    issued_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name="issued_books")
    
    class Meta:
        ordering = ["-borrow_date"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["due_date"]),
        ]
    
    def __str__(self):
        return f"{self.student.names} - {self.book.title}"


class Reservation(TenantModel):
    """Book reservations."""
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reservations")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="library_reservations")
    
    reserved_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateField()
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("fulfilled", "Fulfilled"),
        ("expired", "Expired"),
        ("cancelled", "Cancelled"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    class Meta:
        ordering = ["-reserved_at"]
    
    def __str__(self):
        return f"{self.student.names} reserved {self.book.title}"


class LibraryMember(TenantModel):
    """Library membership for students."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="library_membership")
    member_since = models.DateField(auto_now_add=True)
    membership_type = models.CharField(max_length=50, default="regular")  # regular, premium
    
    # Limits
    max_borrows = models.IntegerField(default=3)
    max_renewals = models.IntegerField(default=2)
    
    # Status
    is_active = models.BooleanField(default=True)
    blocked_until = models.DateField(null=True, blank=True, help_text="If blocked, cannot borrow until this date")
    
    class Meta:
        unique_together = ("school", "student")
    
    def __str__(self):
        return f"{self.student.names} - Member"


class LibrarySettings(TenantModel):
    """Library configuration."""
    
    school = models.OneToOneField("schools.School", on_delete=models.CASCADE, related_name="library_settings")
    
    # Borrowing rules
    max_borrow_days = models.IntegerField(default=14)
    max_borrows_per_student = models.IntegerField(default=3)
    allow_renewal = models.BooleanField(default=True)
    max_renewals = models.IntegerField(default=2)
    
    # Fines
    daily_fine = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    late_fine_applies_after_days = models.IntegerField(default=3)
    
    # Access
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    working_days = models.JSONField(default=list, help_text="['Mon', 'Tue', 'Wed', 'Thu', 'Fri']")
    
    librarian = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="library_settings")
    
    def __str__(self):
        return f"Library settings for {self.school.name}"