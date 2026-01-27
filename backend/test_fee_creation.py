
import os
import django
from rest_framework.test import APIRequestFactory, force_authenticate

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bursary.views import FeeItemViewSet
from schools.models import School
from users.models import User

def test_fee_creation():
    print("Testing Fee Structure Creation (Simulation)...")
    
    # 1. Setup
    school = School.objects.first()
    admin_user = User.objects.filter(role='admin', school=school).first()
    
    if not admin_user:
        print("FAIL: No admin user found.")
        return

    factory = APIRequestFactory()
    view = FeeItemViewSet.as_view({'post': 'create'})
    
    # 2. Simulate Frontend Request
    # Frontend sends: name, amount, class_id, session, term, is_optional
    data = {
        "name": "Tuition Fee Test",
        "amount": "70000.00",
        "class_id": None,
        "session": "2025/2026",
        "term": "First Term",
        "is_optional": False
    }
    
    request = factory.post('/api/fees/', data, format='json')
    force_authenticate(request, user=admin_user)
    
    response = view(request)
    
    # 3. Verify Response
    if response.status_code == 201:
        print("SUCCESS: Fee Structure created successfully!")
        print(f"Created Fee: {response.data}")
    else:
        print(f"FAILED: Status {response.status_code}")
        print(f"Error Detail: {response.data}")

if __name__ == "__main__":
    test_fee_creation()
