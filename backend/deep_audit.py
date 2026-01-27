import os
import django
import json
from decimal import Decimal
from datetime import date, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from bursary.models import Payment, FeeItem, FeeCategory, StudentFee
from academic.models import Student
from users.models import User

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

def dump_db():
    print("--- DB DUMP START ---")
    
    # 1. Users & Schools
    print(f"\n[USERS] Count: {User.objects.count()}")
    for u in User.objects.all():
        school = u.school.name if u.school else "None"
        print(f"User: {u.username} | Role: {u.role} | School: {school} | Super: {u.is_superuser}")

    # 2. Students (Check JSON fields)
    print(f"\n[STUDENTS] Count: {Student.objects.count()}")
    for s in Student.objects.all():
        print(f"Student: {s.names} | School: {s.school.name} | AssignedFees: {s.assigned_fees} | Discounts: {len(s.discounts or [])}")

    # 3. Fee Items
    print(f"\n[FEE ITEMS] Count: {FeeItem.objects.count()}")
    for f in FeeItem.objects.all():
        print(f"Fee: {f.category.name} | Amount: {f.amount} | Target: {f.target_class.name if f.target_class else 'All'} | School: {f.school.name}")

    # 4. Payments
    print(f"\n[PAYMENTS] Count: {Payment.objects.count()}")
    for p in Payment.objects.all():
        print(f"Payment: {p.reference} | Amt: {p.amount} | Student: {p.student.names} | School: {p.school.name} | CreatedBy: {p.recorded_by}")

    print("--- DB DUMP END ---")

if __name__ == '__main__':
    dump_db()
