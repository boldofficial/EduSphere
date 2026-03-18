from django.test import Client
from users.models import User

admin = User.objects.filter(role='SUPER_ADMIN').first()
client = Client()
client.force_login(admin)

endpoints = [
    '/api/schools/list/',
    '/api/schools/plans/',
    '/api/schools/revenue/',
    '/api/schools/analytics/strategic/',
    '/api/schools/governance/',
    '/api/schools/modules/',
    '/api/schools/platform-settings/',
]

for endpoint in endpoints:
    res = client.get(endpoint)
    print(f"{endpoint}: {res.status_code}")
    if res.status_code != 200:
        print(res.content[:200])

