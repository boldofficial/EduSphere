from django.db import models
from django.utils import timezone
from academic.models import Class, Student, Teacher, TenantModel


class BusRoute(TenantModel):
    """School bus routes."""
    
    name = models.CharField(max_length=100, help_text="e.g., Route A - Ikoyi Express")
    description = models.TextField(blank=True)
    
    # Route details
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    waypoints = models.JSONField(default=list, help_text="List of stop names in order")
    
    # Timing
    departure_time = models.TimeField(help_text="Departure time from school")
    estimated_duration = models.IntegerField(help_text="Estimated duration in minutes")
    
    # Vehicle
    vehicle_plate = models.CharField(max_length=20, blank=True)
    vehicle_type = models.CharField(max_length=50, blank=True)
    capacity = models.IntegerField(default=50)
    
    # Driver
    driver_name = models.CharField(max_length=255, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return f"{self.name} ({self.start_location} -> {self.end_location})"


class BusStop(TenantModel):
    """Bus stops on routes."""
    
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="stops")
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    
    # Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Timing
    arrival_order = models.IntegerField(help_text="Order of stop on route")
    estimated_arrival = models.TimeField(help_text="Estimated arrival time at this stop")
    
    students = models.ManyToManyField(Student, blank=True, related_name="bus_stops")
    
    def __str__(self):
        return f"{self.name} (Stop #{self.arrival_order})"


class TransportAssignment(TenantModel):
    """Student transport assignments."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transport_assignments")
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="assignments")
    stop = models.ForeignKey(BusStop, on_delete=models.CASCADE, related_name="assignments")
    
    SESSION_TYPE_CHOICES = (
        ("morning", "Morning Pickup"),
        ("afternoon", "Afternoon Drop-off"),
        ("both", "Both"),
    )
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default="both")
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    pickup_time = models.TimeField(null=True, blank=True)
    drop_time = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("student", "route", "is_active")
    
    def __str__(self):
        return f"{self.student.names} - {self.route.name}"


class TransportFee(TenantModel):
    """Transport fee configuration per session/term."""
    
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="fees")
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment
    payment_frequency = models.CharField(
        max_length=20,
        choices=(
            ("per_term", "Per Term"),
            ("per_month", "Per Month"),
            ("per_session", "Per Session"),
        ),
        default="per_term"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ("route", "session", "term")
    
    def __str__(self):
        return f"{self.route.name} - {self.term} ({self.amount})"


class BusAttendance(TenantModel):
    """Daily bus attendance tracking."""
    
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField(default=timezone.now)
    
    # Morning
    morning_present = models.ManyToManyField(Student, blank=True, related_name="bus_morning_attendance")
    morning_absent = models.JSONField(default=list, blank=True, help_text="List of student IDs")
    
    # Afternoon
    afternoon_present = models.ManyToManyField(Student, blank=True, related_name="bus_afternoon_attendance")
    afternoon_absent = models.JSONField(default=list, blank=True)
    
    recorded_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ("route", "date")
        ordering = ["-date"]
    
    def __str__(self):
        return f"{self.route.name} - {self.date}"


class TransportPayment(TenantModel):
    """Track transport fee payments."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transport_payments")
    assignment = models.ForeignKey(TransportAssignment, on_delete=models.CASCADE, related_name="payments")
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)
    
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    paid_on = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.student.names} - {self.term} ({self.status})"