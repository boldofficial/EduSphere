import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import School, Subscription, SubscriptionPlan, SchoolSettings

def audit_and_fix():
    print("--- AUDIT ---")
    enterprise_plan = SubscriptionPlan.objects.get(slug='enterprise')
    print(f"Enterprise Plan Modules: {len(enterprise_plan.allowed_modules)}")
    
    schools = School.objects.all()
    for s in schools:
        sub = Subscription.objects.filter(school=s).first()
        plan_name = sub.plan.name if sub else "None"
        allowed = sub.plan.allowed_modules if sub else []
        
        print(f"School: {s.name} (ID: {s.id})")
        print(f"  Plan: {plan_name}")
        print(f"  Modules in Plan: {len(allowed)}")
        
        # Force upgrade to Enterprise if requested or if it's the main school
        if s.id == 1 or "Sholems" in s.name or "Bold" in s.name or "fruitful" in s.name:
            if sub:
                sub.plan = enterprise_plan
                sub.save()
                print(f"  [FIX] Upgraded {s.name} to Enterprise")
            
            # Ensure SchoolSettings exists and has permissions
            settings, created = SchoolSettings.objects.get_or_create(school=s)
            new_permissions = {
                "super_admin": {
                    "navigation": ["dashboard", "students", "teachers", "staff", "classes", "grading", "attendance", "bursary", "learning", "announcements", "calendar", "analytics", "id_cards", "broadsheet", "admissions", "newsletter", "messages", "conduct", "cms", "data", "settings", "admin_schools", "admin_revenue", "system_health"],
                    "dashboardWidgets": ["stats", "finance_chart", "student_population", "quick_actions", "recent_transactions", "strategic_analytics", "platform_governance"]
                },
                "admin": {
                    "navigation": ["dashboard", "students", "teachers", "staff", "classes", "grading", "attendance", "bursary", "learning", "announcements", "calendar", "analytics", "id_cards", "broadsheet", "admissions", "newsletter", "messages", "conduct", "cms", "data", "settings"],
                    "dashboardWidgets": ["stats", "finance_chart", "student_population", "quick_actions", "recent_transactions"]
                },
                "teacher": {
                    "navigation": ["dashboard", "grading", "attendance", "learning", "announcements", "calendar", "messages", "conduct"],
                    "dashboardWidgets": ["stats", "quick_actions", "my_classes"]
                },
                "student": {
                    "navigation": ["dashboard", "grading", "attendance", "learning", "announcements", "bursary", "calendar", "id_cards", "newsletter", "messages", "conduct"],
                    "dashboardWidgets": ["my_scores", "my_attendance", "my_fees", "class_info"]
                },
                "parent": {
                    "navigation": ["dashboard", "grading", "attendance", "learning", "announcements", "bursary", "calendar", "id_cards", "newsletter", "messages", "conduct"],
                    "dashboardWidgets": ["my_scores", "my_attendance", "my_fees", "class_info"]
                },
                "staff": {
                    "navigation": ["dashboard", "calendar"],
                    "dashboardWidgets": ["quick_actions", "my_tasks"]
                }
            }
            settings.role_permissions = new_permissions
            settings.save()
            print(f"  [FIX] Updated permissions for {s.name}")

if __name__ == "__main__":
    audit_and_fix()
