import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from users.models import User

# Get a super admin user to authenticate
admin = User.objects.filter(role='SUPER_ADMIN').first()
if not admin:
    print('No super admin found')
else:
    client = Client()
    client.force_login(admin)
    response = client.get('/api/emails/logs/')
    print(f'Status: {response.status_code}')
    if response.status_code == 500:
        print(response.content.decode('utf-8')[:1000])
    else:
        print(response.json())
