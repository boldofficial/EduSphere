import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import SubscriptionPlan

def update_plans():
    # 1. Starter Plan
    starter = SubscriptionPlan.objects.filter(slug='starter').first()
    if starter:
        starter.allowed_modules = ["grading", "students", "teachers", "staff", "classes", "attendance", "bursary"]
        starter.save()
        print(f"Updated {starter.name}")

    # 2. Growth Plan
    growth = SubscriptionPlan.objects.filter(slug='growth').first()
    if growth:
        growth.allowed_modules = ["grading", "students", "teachers", "staff", "classes", "attendance", "bursary", "announcements", "calendar", "analytics"]
        growth.save()
        print(f"Updated {growth.name}")

    # 3. Enterprise Plan
    enterprise = SubscriptionPlan.objects.filter(slug='enterprise').first()
    if enterprise:
        enterprise.allowed_modules = [
            "students", "teachers", "staff", "grading", "bursary", "classes", 
            "attendance", "announcements", "analytics", "calendar", "id_cards", 
            "broadsheet", "newsletter", "admissions", "cms", "messages",
            "learning", "conduct"
        ]
        enterprise.save()
        print(f"Updated {enterprise.name}")

if __name__ == "__main__":
    update_plans()
