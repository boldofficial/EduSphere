
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import SubscriptionPlan

def seed_plans():
    plans = [
        {
            'name': 'Free Pilot',
            'slug': 'enterprise',
            'price': 0,
            'description': 'Full platform access for early adopters.',
            'features': ['Full Platform Access'],
            'allowed_modules': [
                'students', 'teachers', 'staff', 'classes', 'grading',
                'attendance', 'bursary', 'announcements', 'calendar',
                'learning', 'conduct', 'analytics', 'id_cards',
                'broadsheet', 'admissions', 'newsletter', 'messages', 'cms'
            ],
            'duration_days': 730,
            'is_active': True
        }
    ]
    
    for p_data in plans:
        slug = p_data.pop('slug')
        plan, created = SubscriptionPlan.objects.update_or_create(slug=slug, defaults=p_data)
        print(f"{'Created' if created else 'Updated'} plan: {plan.name} (Modules: {len(plan.allowed_modules)})")

seed_plans()
