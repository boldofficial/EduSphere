import os
import django
import sys

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from schools.models import PlatformModule, School, SubscriptionPlan, Subscription

print("--- DIAGNOSTIC START ---")
global_active = []
all_modules = PlatformModule.objects.all()
print(f"Total Platform Modules found: {all_modules.count()}")

for m in all_modules:
    if m.is_active:
        global_active.append(m.module_id)

print(f"Active IDs ({len(global_active)}): {global_active}")

# 2. Check Plans and Intersection
print("\n[INTERSECTION TEST]")
plans = SubscriptionPlan.objects.all()
for p in plans:
    if 'Starter' in p.name:
        print(f"PLAN: {p.name}")
        print(f"   -> Plan Modules:   {p.allowed_modules}")
        print(f"   -> Global Active:  {global_active}")
        
        # Simulate the view logic
        effective = [m for m in p.allowed_modules if m in global_active]
        print(f"   -> INTERSECTION:   {effective}")
        
        if not effective:
            print("   !! WARNING: Intersection is EMPTY. Modules will be invisible.")

print("\n--- DIAGNOSTIC END ---")
