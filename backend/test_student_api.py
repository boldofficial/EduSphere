import os
import django
from rest_framework.test import APIClient

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from schools.models import School

def test_api_as_demo_admin():
    print("Simulating API call as demo_admin...")
    user = User.objects.filter(username='demo_admin').first()
    if not user:
        print("User demo_admin not found")
        return

    client = APIClient()
    client.force_authenticate(user=user)
    
    # Simulate the request the frontend makes
    # Headers are handled by the viewset usually, but TenantMiddleware needs them if no user school
    # Since demo_admin HAS a school, it should work even without headers.
    url = '/api/students/?page=1&page_size=20'
    response = client.get(url)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.data
        print(f"Count: {data.get('count')}")
        print(f"Results Length: {len(data.get('results', []))}")
        if data.get('results'):
            print("First student in results:")
            print(data['results'][0])
    else:
        print(f"Error Response: {response.data}")

if __name__ == "__main__":
    test_api_as_demo_admin()
