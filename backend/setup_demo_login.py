import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School

def setup_demo():
    print("🚀 Setting up Demo Login...")
    
    # 1. Ensure Demo School exists
    school, created = School.objects.get_or_create(
        domain='demo',
        defaults={
            'name': 'Demo School',
            'email': 'admin@demo.com',
            'status': 'active'
        }
    )
    if created:
        print(f"✅ Created school: {school.name}")
    else:
        print(f"ℹ️ School '{school.name}' already exists.")

    # 2. Ensure Demo Admin exists
    username = 'demo_admin'
    password = 'demo_pressure_2025'
    
    user = User.objects.filter(username=username).first()
    if not user:
        user = User.objects.create(
            username=username,
            email='demo@myregistra.net',
            role=User.Role.SCHOOL_ADMIN
        )
        print(f"✅ Created user: {username} with email demo@myregistra.net")
    else:
        print(f"ℹ️ User '{username}' already exists. Updating details...")
        user.email = 'demo@myregistra.net'

    # 3. Set password
    user.set_password(password)
    user.role = User.Role.SCHOOL_ADMIN
    
    # Associate with school
    if user.school != school:
        user.school = school
        print(f"✅ Linked user to school: {school.name}")
    
    user.save()
    print(f"✨ Demo admin setup complete! Username: {username}, Password: {password}")

if __name__ == '__main__':
    setup_demo()
