import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User
from schools.models import School
from bursary.models import Payment

def debug_payments():
    print("--- Debugging Payment Persistence ---")
    
    # 1. Check Users
    print("\n[Users]")
    for user in User.objects.all():
        school_name = user.school.name if user.school else "None"
        print(f"User: {user.username}, Role: {user.role}, IsSuperUser: {user.is_superuser}, School: {school_name}")

    # 2. Check Payments
    print("\n[Payments]")
    payments = Payment.objects.all()
    print(f"Total Payments in DB: {payments.count()}")
    
    for p in payments:
        school_name = p.school.name if p.school else "None"
        print(f"Payment Ref: {p.reference}, Amount: {p.amount}, School: {school_name}, RecordedBy: {p.recorded_by}")

    # 3. Check Schema Constraints (Manual check via model meta)
    print("\n[Schema]")
    field = Payment._meta.get_field('school')
    print(f"Payment.school field: null={field.null}, blank={field.blank}")

if __name__ == '__main__':
    debug_payments()
