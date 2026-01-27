from schools.models import School, SubscriptionPlan
from users.views import get_user_me_data
from django.contrib.auth import get_user_model
import json

User = get_user_model()

print("--- PLAN AUDIT ---")
for plan in SubscriptionPlan.objects.all():
    print(f"Plan: {plan.name}")
    print(f"  Allowed Modules: {plan.allowed_modules}")

print("\n--- USER MODULE AUDIT ---")
for user in User.objects.filter(role='SCHOOL_ADMIN'):
    data = get_user_me_data(user)
    print(f"User: {user.email}")
    if data['subscription']:
        print(f"  Plan: {data['subscription']['plan_name']}")
        print(f"  Effective Modules: {data['subscription']['allowed_modules']}")
    else:
        print("  No subscription found")
