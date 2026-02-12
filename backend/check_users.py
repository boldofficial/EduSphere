import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School

def check_users():
    print("Checking All Users and their Schools...")
    users = User.objects.all().select_related('school')
    for u in users:
        school_name = u.school.name if u.school else "NO SCHOOL"
        print(f"User: {u.username} | Role: {u.role} | School: {school_name} (ID: {u.school_id})")

if __name__ == "__main__":
    check_users()
