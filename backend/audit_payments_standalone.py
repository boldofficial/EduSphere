import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from bursary.models import Payment
from schools.models import School
from users.models import User

def audit():
    with open('audit_final_log.txt', 'w') as f:
        f.write("--- AUDIT START ---\n")
        
        # 1. School Check
        schools = School.objects.all()
        f.write(f"Schools Count: {schools.count()}\n")
        for s in schools:
            f.write(f"School: {s.name} (ID: {s.id})\n")

        # 2. User Check (Admin)
        admin = User.objects.filter(username__iexact='ADMIN').first()
        if admin:
            f.write(f"User 'ADMIN' School: {admin.school.name if admin.school else 'None'} (ID: {admin.school.id if admin.school else 'None'})\n")
        else:
            f.write("User 'ADMIN' not found.\n")
            
        # 3. Last Payment Check
        last_pay = Payment.objects.last()
        if last_pay:
            f.write(f"LAST PAY: ID={last_pay.id}, Ref={last_pay.reference}, School={last_pay.school.name} (ID: {last_pay.school.id})\n")
            
            # Comparison
            if admin and admin.school and last_pay.school:
                match = admin.school.id == last_pay.school.id
                f.write(f"MATCH CHECK: Admin School ID == Payment School ID? {match}\n")
        else:
            f.write("No payments found.\n")

        f.write("--- AUDIT END ---\n")
    print("Log written to audit_final_log.txt")

if __name__ == '__main__':
    audit()
