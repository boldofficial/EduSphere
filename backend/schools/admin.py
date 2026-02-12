from django.contrib import admin
from django.utils import timezone
from .models import DemoRequest
try:
    from emails.utils import send_template_email
except ImportError:
    send_template_email = None

# Helper action to approve requests
@admin.action(description='Approve selected requests and send credentials')
def approve_demo_requests(modeladmin, request, queryset):
    # Filter for pending requests to avoid re-approving
    success_count = 0
    email_count = 0
    
    for demo_req in queryset:
        if demo_req.status != 'approved':
            demo_req.status = 'approved'
            demo_req.approved_by = request.user
            demo_req.save()
            
            # Send Email Notification
            if send_template_email:
                # Context variables for the email template
                context = {
                    'name': demo_req.name,
                    'email': demo_req.email,
                    'school_name': demo_req.school_name,
                    'login_url': "https://demo.myregistra.net/login", # Typically constant for demo
                    'username': "demo_admin", # Generic demo credentials
                    'password': "demo_pressure_2025" # Generic demo credentials
                }
                
                if send_template_email('demo-approved', demo_req.email, context):
                    email_count += 1
            
            success_count += 1
            
    if email_count > 0:
        modeladmin.message_user(request, f"{success_count} requests approved. {email_count} emails sent.")
    else:
        modeladmin.message_user(request, f"{success_count} requests approved. No emails sent (check 'demo-approved' template).")

@admin.register(DemoRequest)
class DemoRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'school_name', 'role', 'status', 'created_at', 'approved_by')
    list_filter = ('status', 'role', 'created_at')
    search_fields = ('name', 'email', 'school_name')
    readonly_fields = ('created_at', 'updated_at', 'approved_by')
    actions = [approve_demo_requests]
    
    fieldsets = (
        ('Applicant Details', {
            'fields': ('name', 'email', 'phone', 'school_name', 'role')
        }),
        ('Status', {
            'fields': ('status', 'admin_notes', 'approved_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if change and "status" in form.changed_data and obj.status == 'approved' and not obj.approved_by:
             obj.approved_by = request.user
        super().save_model(request, obj, form, change)
