import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School

def check():
    print("--- Checking Demo School ---")
    s = School.objects.filter(domain='demo').first()
    if s:
        print(f"School: {s.name} (Domain: {s.domain}, ID: {s.id})")
    else:
        print("❌ School with domain 'demo' not found.")

    print("\n--- Checking Demo User ---")
    u = User.objects.filter(username='demo_admin').first()
    if u:
        print(f"User: {u.username} (ID: {u.id}, Role: {u.role})")
        print(f"School associated with user: {u.school.name if u.school else 'None'}")
        if s and u.school != s:
            print(f"⚠️ User is NOT associated with the 'demo' school.")
    else:
        print("❌ User 'demo_admin' not found.")

if __name__ == '__main__':
    check()
