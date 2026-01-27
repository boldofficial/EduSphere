import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import SubscriptionPlan

plans = [
    {
        "name": "Starter Plan",
        "slug": "starter",
        "price": 0.00,
        "duration_days": 30,
        "description": "Perfect for small schools just starting out.",
        "features": ["Up to 50 Students", "Basic Grading", "Term Reports", "Attendance Tracking", "Email Support", "1 User Admin"],
        "is_active": True
    },
    {
        "name": "Growth Plan",
        "slug": "growth",
        "price": 15000.00,
        "duration_days": 30,
        "description": "For growing schools needing more power.",
        "features": ["Up to 500 Students", "Advanced Financials", "CBT System", "Parent Portal", "Priority Support", "5 User Admins", "SMS Notifications"],
        "is_active": True
    },
    {
        "name": "Enterprise Plan",
        "slug": "enterprise",
        "price": 45000.00,
        "duration_days": 30,
        "description": "Full-scale solution for established institutions.",
        "features": ["Unlimited Students", "Multi-Campus Support", "Custom Branding", "API Access", "Dedicated Account Manager", "Unlimited Admins", "White-label Mobile App"],
        "is_active": True
    }
]

for p in plans:
    plan, created = SubscriptionPlan.objects.get_or_create(
        slug=p['slug'],
        defaults={
            'name': p['name'],
            'price': p['price'],
            'duration_days': p['duration_days'],
            'description': p['description'],
            'features': p['features'],
            'is_active': p['is_active']
        }
    )
    if created:
        print(f"Created Plan: {plan.name}")
    else:
        print(f"Plan already exists: {plan.name}")
