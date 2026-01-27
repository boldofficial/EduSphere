import os
import django
import json
from decimal import Decimal
from datetime import date, datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import sys
sys.path.append(os.getcwd()) # Ensure modules can be imported from current directory
django.setup()

from bursary.models import Payment
from users.models import Settings, User

def run_diagnosis():
    print("--- DIAGNOSIS START ---")
    settings = Settings.objects.first()
    recent_payments = Payment.objects.all().order_by('-created_at')[:5]
    
    # Get ADMIN user details
    admin = User.objects.filter(username__iexact='ADMIN').first()
    
    data = {
        "current_settings": {
            "session": settings.current_session if settings else None,
            "term": settings.current_term if settings else None,
        },
        "recent_payments": [
            {
                "id": p.id,
                "reference": p.reference,
                "amount": p.amount,
                "session": p.session,
                "term": p.term,
                "school": p.school.name if p.school else None,
                "recorded_by": p.recorded_by
            } for p in recent_payments
        ],
        "total_payments": Payment.objects.count(),
        "admin_user_school": admin.school.name if (admin and admin.school) else "None"
    }
    print(json.dumps(data, indent=2, cls=DateTimeEncoder))
    print("--- DIAGNOSIS END ---")

if __name__ == '__main__':
    run_diagnosis()
