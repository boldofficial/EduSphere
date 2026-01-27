import os
import sys
import json
from datetime import date, datetime
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from users.models import User
from bursary.models import Payment
from schools.models import School, SchoolSettings

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

def diagnose():
    try:
        with open('sholems_log_2.txt', 'w') as f:
            f.write("--- SHOLEMSVISION DIAGNOSIS ---\n")
            
            # 1. Get User
            u = User.objects.filter(username__iexact='sholemsvision').first()
            if not u:
                f.write("User 'sholemsvision' not found.\n")
                return
                
            f.write(f"User: {u.username} (ID: {u.id})\n")
            f.write(f"School: {u.school.name} (ID: {u.school.id})\n")
            
            # 2. Settings
            settings = SchoolSettings.objects.filter(school=u.school).first()
            if settings:
                f.write(f"SETTINGS: Session='{settings.current_session}', Term='{settings.current_term}'\n")
            else:
                f.write("SETTINGS: None found for this school.\n")

            # 3. Last Payment
            last_pay = Payment.objects.filter(school=u.school).order_by('-created_at').first()
            if last_pay:
                f.write(f"LAST PAY: ID={last_pay.id}, Ref={last_pay.reference}\n")
                f.write(f"   Session='{last_pay.session}', Term='{last_pay.term}'\n")
                f.write(f"   Amount={last_pay.amount}\n")
                f.write(f"   CreatedBy={last_pay.recorded_by}\n")
                f.write(f"   Student={last_pay.student.names} (ID: {last_pay.student.id})\n")
            else:
                f.write("LAST PAY: None found for this school.\n")
        print("Logged to sholems_log_2.txt")
    except Exception as e:
        print(e)

if __name__ == '__main__':
    diagnose()
