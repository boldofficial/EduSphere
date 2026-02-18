import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from schools.models import PlatformModule, Subscription, School, SchoolSettings

print('--- PLATFORM MODULES ---')
for m in PlatformModule.objects.all():
    print(f'{m.module_id}: {m.is_active}')

print('\n--- DEMO SCHOOL ---')
try:
    school = School.objects.get(domain='demo')
    print(f'ID: {school.id}, Name: {school.name}')
    
    sub = Subscription.objects.filter(school=school).first()
    if sub:
        print(f'Subscription: {sub.plan.name}, Status: {sub.status}')
        print(f'Plan Allowed Modules: {sub.plan.allowed_modules}')
    else:
        print('NO SUBSCRIPTION FOUND')
        
    settings = SchoolSettings.objects.get(school=school)
    print(f'Settings Found: {settings.id}')
    print(f'Admin Nav: {settings.role_permissions.get("admin", {}).get("navigation")}')
    print(f'Admin Widgets: {settings.role_permissions.get("admin", {}).get("dashboardWidgets")}')
except Exception as e:
    print(f'ERROR: {str(e)}')
