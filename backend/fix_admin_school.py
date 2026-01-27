import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User
from schools.models import School

def fix_admin_school():
    print("--- Fixing Admin School Link ---")
    
    # 1. Get School (Create if missing)
    school = School.objects.first()
    if not school:
        school = School.objects.create(name="Default School", address="Main Campus")
        print(f"Created new school: {school.name}")
    else:
        print(f"Found school: {school.name}")

    # 2. Fix Superusers/Admins
    admins = User.objects.filter(is_superuser=True) # or role='admin'
    
    for admin in admins:
        if not admin.school:
            print(f"Assigning school to Admin: {admin.username}")
            admin.school = school
            admin.save()
            print("Done.")
        else:
            print(f"Admin {admin.username} already has school: {admin.school.name}")
            
    # Also check specific 'ADMIN' username from screenshot if it's not is_active
    try:
        named_admin = User.objects.get(username__iexact='ADMIN')
        if not named_admin.school:
            named_admin.school = school
            named_admin.save()
            print(f"Fixed specific user 'ADMIN'")
    except User.DoesNotExist:
        pass

if __name__ == '__main__':
    fix_admin_school()
