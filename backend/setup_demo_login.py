import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School, Subscription, SubscriptionPlan, PlatformModule, SchoolSettings
from django.utils import timezone
from datetime import timedelta

def setup_demo():
    print("🚀 Setting up All Demo Portal Logins & Environment...")
    
    # 0. Sync Modules
    print("📦 Syncing Platform Modules...")
    PlatformModule.sync_from_registry()
    # FORCE ACTIVATE ALL MODULES for demo environment
    PlatformModule.objects.all().update(is_active=True)
    print(f"✅ Activated {PlatformModule.objects.count()} platform modules.")
    
    # 1. Ensure Demo School exists (Domain must be 'demo' for magic login logic)
    school, created = School.objects.get_or_create(
        domain='demo',
        defaults={
            'name': 'Bold Ideas Innovations School',
            'email': 'admin@boldideas.edu'
        }
    )
    if created:
        print(f"✅ Created school: {school.name}")
    else:
        print(f"ℹ️ School '{school.name}' already exists.")

    # 2. Define Demo Users
    demo_users = [
        {
            'username': 'demo@myregistra.net',
            'email': 'demo@myregistra.net',
            'role': User.Role.SCHOOL_ADMIN,
            'label': 'Admin'
        },
        {
            'username': 'teacher@myregistra.net',
            'email': 'teacher@myregistra.net',
            'role': User.Role.TEACHER,
            'label': 'Teacher'
        },
        {
            'username': 'ST001@demo',
            'email': 'student@myregistra.net',
            'role': User.Role.STUDENT,
            'label': 'Student / Parent'
        },
        {
            'username': 'staff@myregistra.net',
            'email': 'staff@myregistra.net',
            'role': User.Role.STAFF,
            'label': 'Non Teaching'
        }
    ]
    
    password = 'demo_pressure_2025'
    
    for creds in demo_users:
        user = User.objects.filter(username=creds['username']).first()
        if not user:
            user = User.objects.create(
                username=creds['username'],
                email=creds['email'],
                role=creds['role']
            )
            print(f"✅ Created {creds['label']} user: {creds['username']}")
        else:
            print(f"ℹ️ {creds['label']} user exists. Syncing credentials...")
            user.email = creds['email']
            user.role = creds['role']

        user.set_password(password)
        
        if user.school != school:
            user.school = school
            print(f"   - Linked to demo school")
        
        user.save()

        # 3. Create Profile Models
        if user.role == User.Role.STUDENT:
            from academic.models import Student
            Student.objects.update_or_create(
                user=user,
                defaults={
                    'school': school,
                    'student_no': 'ST001',
                    'names': 'Demo Student',
                    'gender': 'Male'
                }
            )
            print(f"   - Created Student Profile (NO: ST001)")
            
        elif user.role == User.Role.STAFF:
            from academic.models import Teacher
            Teacher.objects.update_or_create(
                user=user,
                defaults={
                    'school': school,
                    'name': 'Demo Staff Member',
                    'staff_type': 'NON_ACADEMIC',
                    'role': 'Bursar',
                    'email': user.email
                }
            )
            print(f"   - Created Non-Academic Staff Profile")

        elif user.role == User.Role.TEACHER:
            from academic.models import Teacher
            Teacher.objects.update_or_create(
                user=user,
                defaults={
                    'school': school,
                    'name': 'Demo Teacher',
                    'staff_type': 'ACADEMIC',
                    'email': user.email
                }
            )
            print(f"   - Created Teacher Profile")

        print(f"   - Login Email: {user.email}")
        print(f"   - Status: Active")

    print(f"\n✨ All 4 Demo Portals are now ready with password: {password}")

    # 4. Initialize Subscription and SchoolSettings
    print("\n🛠️  Initializing Subscription and SchoolSettings...")
    
    # Ensure Plan exists
    plan = SubscriptionPlan.objects.filter(slug='enterprise').first()
    if not plan:
        print("⚠️ Enterprise plan not found. Seeding plans first...")
        import subprocess
        subprocess.run(['python', 'seed_plans.py'])
        plan = SubscriptionPlan.objects.filter(slug='enterprise').first()

    if plan:
        sub, created = Subscription.objects.update_or_create(
            school=school,
            defaults={
                'plan': plan,
                'status': 'active',
                'end_date': timezone.now() + timedelta(days=730)
            }
        )
        print(f"✅ Subscription: {sub.plan.name} ({sub.status})")

    # Initialize Settings with Role Permissions
    role_perms = {
        "super_admin": {
            "navigation": ["dashboard", "students", "teachers", "staff", "classes", "timetables", "grading", "attendance", "bursary", "learning", "announcements", "calendar", "analytics", "id_cards", "broadsheet", "admissions", "newsletter", "messages", "conduct", "cms", "data", "settings", "support"],
            "dashboardWidgets": ["stats", "finance_chart", "student_population", "quick_actions", "recent_transactions"]
        },
        "admin": {
            "navigation": ["dashboard", "students", "teachers", "staff", "classes", "timetables", "grading", "attendance", "bursary", "learning", "announcements", "calendar", "analytics", "id_cards", "broadsheet", "admissions", "newsletter", "messages", "conduct", "cms", "data", "settings", "support"],
            "dashboardWidgets": ["stats", "finance_chart", "student_population", "quick_actions", "recent_transactions"]
        },
        "teacher": {
            "navigation": ["dashboard", "timetables", "grading", "attendance", "learning", "announcements", "calendar", "messages", "conduct"],
            "dashboardWidgets": ["stats", "quick_actions", "my_classes"]
        },
        "student": {
            "navigation": ["dashboard", "timetables", "grading", "attendance", "learning", "announcements", "bursary", "calendar", "id_cards", "newsletter", "messages", "conduct"],
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

    settings_obj, created = SchoolSettings.objects.update_or_create(
        school=school,
        defaults={
            'role_permissions': role_perms,
            'current_session': '2025/2026',
            'current_term': 'First Term'
        }
    )
    print(f"✅ SchoolSettings: Initialized with {len(role_perms)} role configurations")
    print("\n🚀 Setup Complete!")

if __name__ == '__main__':
    setup_demo()
