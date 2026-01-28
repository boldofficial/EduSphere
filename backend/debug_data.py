import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School

print("-" * 60)
print(f"{'Username':<20} | {'Role':<15} | {'School Domain':<20} | {'Email'}")
print("-" * 60)

for user in User.objects.all().select_related('school'):
    school_domain = user.school.domain if user.school else "NO SCHOOL"
    print(f"{user.username:<20} | {user.role:<15} | {school_domain:<20} | {user.email}")

print("-" * 60)
print("Available Schools:")
for school in School.objects.all():
    print(f"- {school.name}: {school.domain} (Custom: {school.custom_domain})")
