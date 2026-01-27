import os
import django
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User
from schools.models import School
from bursary.serializers import FeeItemSerializer
from bursary.models import FeeItem, FeeCategory

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def verify_fee_creation():
    print("--- Verifying FeeItem Creation ---")
    
    # Setup User & School
    school, _ = School.objects.get_or_create(name="FeeTestSchool")
    user, _ = User.objects.get_or_create(username="feetestuser", defaults={'school': school, 'role': 'admin'})
    
    # Mock Request
    factory = APIRequestFactory()
    data = {
        "name": "Test Tuition Fee",
        "amount": 50000,
        "is_optional": False,
        "session": "2025/2026",
        "term": "First Term",
        "class_id": None
    }
    request = factory.post('/api/fees/', data, format='json')
    force_authenticate(request, user=user)
    request.user = user # Explicitly set for serializer context usage if needed
    
    # Init Serializer
    serializer = FeeItemSerializer(data=data, context={'request': request})
    
    if serializer.is_valid():
        print("[PASS] Serializer Valid")
        fee_item = serializer.save()
        print(f"Created FeeItem: {fee_item} (ID: {fee_item.id})")
        print(f"Category: {fee_item.category.name}")
        print(f"School: {fee_item.school.name}")
        
        # Verify Persistence
        if FeeItem.objects.filter(id=fee_item.id).exists():
            print("[SUCCESS] FeeItem persisted in DB.")
        else:
            print("[FAIL] FeeItem NOT found in DB after save.")
            
        # Verify Category
        if FeeCategory.objects.filter(name="Test Tuition Fee", school=school).exists():
            print("[SUCCESS] FeeCategory created.")
        else:
            print("[FAIL] FeeCategory not created.")

    else:
        print(f"[FAIL] Validation Errors: {serializer.errors}")

if __name__ == '__main__':
    verify_fee_creation()
