from schools.models import SubscriptionPlan, PlatformModule
from users.views import get_user_me_data
from django.contrib.auth import get_user_model
import json

User = get_user_model()

print("=== GLOBAL MODULES REGISTRY ===")
global_modules = {m.module_id: m.is_active for m in PlatformModule.objects.all()}
for mid, active in global_modules.items():
    print(f"ID: {mid:20} | Active: {active}")

print("\n=== SUBSCRIPTION PLANS AUDIT ===")
for plan in SubscriptionPlan.objects.all():
    print(f"\nPLAN: {plan.name} ({plan.slug})")
    print(f"  Raw Modules: {plan.allowed_modules}")
    
    # Check for invalid IDs
    invalid = [m for m in plan.allowed_modules if m not in global_modules]
    if invalid:
        print(f"  WARNING: Invalid IDs found: {invalid}")
    
    # Check for inactive modules
    inactive = [m for m in plan.allowed_modules if m in global_modules and not global_modules[m]]
    if inactive:
        print(f"  WARNING: Inactive modules included: {inactive}")

print("\n=== SCHOOL ADMIN ACCESS AUDIT ===")
for user in User.objects.filter(role='SCHOOL_ADMIN'):
    data = get_user_me_data(user)
    print(f"\nUser: {user.email}")
    if user.school:
        print(f"  School: {user.school.name}")
    if data['subscription']:
        print(f"  Active Plan: {data['subscription']['plan_name']}")
        print(f"  Status: {data['subscription']['status']}")
        print(f"  Effective Modules: {data['subscription']['allowed_modules']}")
    else:
        print("  NO ACTIVE SUBSCRIPTION")
