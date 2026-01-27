import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import SchoolSettings

def update_permissions():
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

    settings_to_update = SchoolSettings.objects.all()
    count = 0
    for s in settings_to_update:
        s.role_permissions = new_permissions
        s.save()
        count += 1
        print(f"Updated permissions for school: {s.school.name}")
    
    print(f"\nSuccessfully updated {count} schools.")

if __name__ == "__main__":
    update_permissions()
