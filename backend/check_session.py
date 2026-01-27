import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from bursary.models import Payment
from users.models import Settings

def check_mismatch():
    print("--- Session/Term Mismatch Check ---")
    
    # 1. Current Settings
    settings = Settings.objects.first()
    if settings:
        print(f"CURRENT SETTINGS: Session='{settings.current_session}', Term='{settings.current_term}'")
    else:
        print("CURRENT SETTINGS: None (Using defaults?)")

    # 2. Recent Payments
    print("\n[Recent Payments]")
    payments = Payment.objects.all().order_by('-created_at')[:5]
    if not payments:
        print("No payments found in DB.")
    
    for p in payments:
        print(f"Payment {p.reference}: Session='{p.session}', Term='{p.term}', Amount={p.amount}")

if __name__ == '__main__':
    check_mismatch()
