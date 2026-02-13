import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from schools.models import SubscriptionPlan

def setup_pilot_plan():
    print("Setting up Free Enterprise Pilot Plan...")
    
    plan, created = SubscriptionPlan.objects.get_or_create(
        slug='enterprise',
        defaults={
            'name': 'Enterprise',
            'price': 0.00,
            'duration_days': 730,
            'is_active': True,
            'description': 'Full platform access for the 2025/2026 pilot session.',
            'features': [
                'Unlimited Students & Staff',
                'Global Academic Broadsheets',
                'Advanced PDF Report Cards',
                'Bursary & Expense Tracking',
                'Automated Fee Management',
                'Dedicated Technical Support',
                'School Website & CMS',
                'Multi-Portal Ecosystem'
            ],
            'allowed_modules': [
                'students', 'teachers', 'staff', 'classes', 'grading',
                'attendance', 'bursary', 'announcements', 'calendar',
                'learning', 'conduct', 'analytics', 'id_cards',
                'broadsheet', 'admissions', 'newsletter', 'messages', 'cms'
            ]
        }
    )
    
    if not created:
        print(f"Updating existing Enterprise plan to Free Pilot (₦0.00)")
        plan.price = 0.00
        plan.is_active = True
        plan.duration_days = 730
        plan.save()
        
    # Deactivate other plans to ensure only Enterprise shows up if fallback fails
    SubscriptionPlan.objects.exclude(slug='enterprise').update(is_active=False)
    
    print("Pilot plan configuration successful!")

if __name__ == "__main__":
    setup_pilot_plan()
