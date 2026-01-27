import os
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from users.models import User
from bursary.models import Payment

def check_users():
    print("--- ALL USERS ---")
    for u in User.objects.all():
        print(f"ID: {u.id} | User: {u.username} | Role: {u.role} | Super: {u.is_superuser} | School: {u.school.name if u.school else 'None'} (ID: {u.school.id if u.school else 'None'})")

    print("\n--- NEWEST PAYMENT ---")
    p = Payment.objects.last()
    if p:
        print(f"ID: {p.id} | Ref: {p.reference} | School: {p.school.name if p.school else 'None'} | CreatedBy: {p.recorded_by}")
    else:
        print("No payments.")

if __name__ == '__main__':
    check_users()
