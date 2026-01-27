import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import SubscriptionPlan, PlatformModule, School
from users.views import get_user_me_data
from django.contrib.auth import get_user_model

User = get_user_model()

audit_data = {
    'registry': {},
    'plans': [],
    'users': []
}

# Registry
for m in PlatformModule.objects.all():
    audit_data['registry'][m.module_id] = {
        'name': m.name,
        'is_active': m.is_active
    }

# Plans
for p in SubscriptionPlan.objects.all():
    audit_data['plans'].append({
        'id': p.id,
        'name': p.name,
        'slug': p.slug,
        'allowed_modules': p.allowed_modules
    })

# Users
for u in User.objects.filter(role='SCHOOL_ADMIN'):
    data = get_user_me_data(u)
    audit_data['users'].append({
        'email': u.email,
        'school': u.school.name if u.school else None,
        'subscription': data.get('subscription')
    })

with open('final_audit.json', 'w') as f:
    json.dump(audit_data, f, indent=2)

print("Audit written to final_audit.json")
