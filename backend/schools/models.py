from django.db import models

# Platform-wide module registry
MODULES = [
    {'id': 'students', 'name': 'Student Management', 'description': 'Manage student profiles, enrollment and admission.'},
    {'id': 'teachers', 'name': 'Teacher Management', 'description': 'Track academic staff and assignments.'},
    {'id': 'staff', 'name': 'Non-Academic Staff', 'description': 'Manage support staff and operational tasks.'},
    {'id': 'classes', 'name': 'Class Management', 'description': 'Setup classes, curricula and subjects.'},
    {'id': 'grading', 'name': 'Grading & Results', 'description': 'Enter scores, calculate averages and generate reports.'},
    {'id': 'attendance', 'name': 'Attendance Tracking', 'description': 'Daily attendance for students and staff.'},
    {'id': 'bursary', 'name': 'Bursary & Finance', 'description': 'Manage school fees, expenses and payroll.'},
    {'id': 'announcements', 'name': 'Internal Broadcasts', 'description': 'Send messages to parents/staff within the school.'},
    {'id': 'calendar', 'name': 'School Calendar', 'description': 'Schedule events and holidays.'},
    {'id': 'learning', 'name': 'Learning Center', 'description': 'Access educational resources and lessons.'},
    {'id': 'conduct', 'name': 'Conduct & Log', 'description': 'Track student behavior and discipline logs.'},
    {'id': 'analytics', 'name': 'School Analytics', 'description': 'Performance and financial insights.'},
    {'id': 'id_cards', 'name': 'ID Card Generator', 'description': 'Generate professional IDs for students.'},
    {'id': 'broadsheet', 'name': 'Master Broadsheet', 'description': 'Generate comprehensive result sheets for terms.'},
    {'id': 'admissions', 'name': 'Online Admissions', 'description': 'Handle application forms and admission processing.'},
    {'id': 'newsletter', 'name': 'School newsletter', 'description': 'Create and publish newsletters for parents.'},
    {'id': 'messages', 'name': 'Direct Messaging', 'description': 'Internal chat and messaging for staff/parents.'},
    {'id': 'cms', 'name': 'Website CMS', 'description': 'Manage school website content and landing page.'},
]

class School(models.Model):
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, unique=True, null=True, blank=True, help_text="Permanent slug/subdomain (e.g. 'vine')")
    custom_domain = models.CharField(max_length=255, unique=True, null=True, blank=True, help_text="Optional custom domain (e.g. 'portal.vineheritage.com')")
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True) # Official school email
    contact_person = models.CharField(max_length=255, null=True, blank=True)
    logo = models.TextField(null=True, blank=True) # URL or Base64 to logo
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['domain']),
            models.Index(fields=['custom_domain']),
            models.Index(fields=['created_at']),
        ]

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField(default=30) # 30 for monthly, 365 for yearly
    description = models.TextField(blank=True)
    features = models.JSONField(default=list) # List of feature strings (marketing)
    allowed_modules = models.JSONField(default=list) # List of module IDs (students, bursary, etc.)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₦{self.price}"

class PlatformModule(models.Model):
    """Global master switches for platform features."""
    module_id = models.CharField(max_length=50, unique=True) # students, grading, etc.
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} {'(ON)' if self.is_active else '(OFF)'}"

    @classmethod
    def sync_from_registry(cls):
        """Sync model instances with the MODULES constant."""
        existing_ids = set(cls.objects.values_list('module_id', flat=True))
        for mod in MODULES:
            if mod['id'] not in existing_ids:
                cls.objects.create(
                    module_id=mod['id'],
                    name=mod['name'],
                    description=mod['description'],
                    is_active=True # Default to ON
                )

class Subscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('pending', 'Pending Payment'),
    )

    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.school.name} - {self.plan.name} ({self.status})"

class SchoolPayment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True) # e.g. Paystack reference
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.school.name} - {self.amount} ({self.status})"
class SchoolSettings(models.Model):
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='settings')
    current_session = models.CharField(max_length=20, default='2025/2026')
    current_term = models.CharField(max_length=50, default='First Term')
    school_tagline = models.CharField(max_length=255, null=True, blank=True)
    
    # Media
    watermark_media = models.TextField(null=True, blank=True) # Base64 or URL
    
    # Signatories
    director_name = models.CharField(max_length=255, null=True, blank=True)
    director_signature = models.TextField(null=True, blank=True)
    head_of_school_name = models.CharField(max_length=255, null=True, blank=True)
    head_of_school_signature = models.TextField(null=True, blank=True)
    
    # Report Card / UI Settings
    subjects_global = models.JSONField(default=list, blank=True)
    terms_list = models.JSONField(default=list, blank=True) # terms is a reserved keyword in some contexts, using terms_list
    show_position = models.BooleanField(default=True)
    show_skills = models.BooleanField(default=True)
    tiled_watermark = models.BooleanField(default=False)
    next_term_begins = models.DateField(null=True, blank=True)
    class_teacher_label = models.CharField(max_length=100, default='Class Teacher')
    head_teacher_label = models.CharField(max_length=100, default='Head of School')
    report_font_family = models.CharField(max_length=100, default='inherit')
    report_scale = models.IntegerField(default=100)
    
    # Landing Page CMS
    landing_hero_title = models.CharField(max_length=255, null=True, blank=True)
    landing_hero_subtitle = models.CharField(max_length=255, null=True, blank=True)
    landing_features = models.TextField(null=True, blank=True)
    landing_hero_image = models.TextField(null=True, blank=True)
    landing_about_text = models.TextField(null=True, blank=True)
    landing_gallery_images = models.JSONField(default=list, blank=True)
    landing_primary_color = models.CharField(max_length=7, default='#1A3A5C')
    landing_show_stats = models.BooleanField(default=True)
    landing_cta_text = models.CharField(max_length=50, default='Start Your Journey')
    
    # New CMS Fields for structured content
    landing_core_values = models.JSONField(default=list, blank=True) # list of {title, description, icon}
    landing_academic_programs = models.JSONField(default=list, blank=True) # list of {title, age_range, description, image}
    landing_testimonials = models.JSONField(default=list, blank=True) # list of {name, role, quote, image}
    landing_stats_config = models.JSONField(default=dict, blank=True) # {students: true, teachers: true, etc}
    
    # Promotion & Finance
    promotion_threshold = models.IntegerField(default=50)
    promotion_rules = models.CharField(max_length=20, choices=(('auto', 'Auto'), ('manual', 'Manual')), default='manual')
    show_bank_details = models.BooleanField(default=True)
    bank_name = models.CharField(max_length=255, null=True, blank=True)
    bank_account_name = models.CharField(max_length=255, null=True, blank=True)
    bank_account_number = models.CharField(max_length=20, null=True, blank=True)
    bank_sort_code = models.CharField(max_length=20, null=True, blank=True)
    invoice_notes = models.TextField(null=True, blank=True)
    invoice_due_days = models.IntegerField(default=14)
    
    # Permissions
    role_permissions = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Settings for {self.school.name}"
