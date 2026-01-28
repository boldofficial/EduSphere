import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

with open('users_dump.txt', 'w') as f:
    f.write("--- USER DUMP ---\n")
    for u in User.objects.all():
        school_domain = u.school.domain if u.school else "None"
        f.write(f"ID: {u.id} | User: {u.username} | Email: {u.email} | Role: {u.role} | Active: {u.is_active} | School: {school_domain}\n")
    f.write("--- END ---\n")
print("Dump completed to users_dump.txt")
