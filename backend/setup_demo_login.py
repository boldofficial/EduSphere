import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School

def setup_demo():
    print("🚀 Setting up All Demo Portal Logins...")
    
    # 1. Ensure Demo School exists (Domain must be 'demo' for magic login logic)
    school, created = School.objects.get_or_create(
        domain='demo',
        defaults={
            'name': 'Bold Ideas Innovations School',
            'email': 'admin@boldideas.edu',
            'status': 'active'
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

if __name__ == '__main__':
    setup_demo()
