import os
import django
import json
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import User

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academic.models import ReportCard
from academic.views import ReportCardViewSet

def test_list_consistency():
    # Setup
    user = User.objects.filter(role='SUPER_ADMIN').first() or User.objects.filter(is_superuser=True).first()
    if not user:
        print("No admin user found.")
        return

    factory = APIRequestFactory()
    view = ReportCardViewSet.as_view({'get': 'list'})

    # 1. Initial List Fetch
    req1 = factory.get('/api/reports/')
    force_authenticate(req1, user=user)
    resp1 = view(req1)
    
    if hasattr(resp1, 'data') and 'results' in resp1.data:
        initial_data = resp1.data['results']
    else:
        initial_data = resp1.data
    
    if not initial_data:
        print("No report cards found.")
        return

    target_rc = initial_data[0]
    target_id = target_rc['id']
    print(f"Target ReportCard ID: {target_id}")
    print(f"Initial Average: {target_rc['average']}")

    # 2. Update via ORM (Simulating Backend Update)
    print("Updating ReportCard in DB directly...")
    rc_obj = ReportCard.objects.get(pk=target_id)
    # Toggle average to something distinctive
    new_avg = 99.99
    rc_obj.average = new_avg
    rc_obj.total_score = 100
    rc_obj.save()
    
    # 3. Fetch List Again Immediately
    req2 = factory.get('/api/reports/')
    force_authenticate(req2, user=user)
    resp2 = view(req2)
    
    if hasattr(resp2, 'data') and 'results' in resp2.data:
        final_data = resp2.data['results']
    else:
        final_data = resp2.data
        
    updated_rc = next((item for item in final_data if item['id'] == target_id), None)
    
    if updated_rc:
        print(f"Final Average from List API: {updated_rc['average']}")
        if updated_rc['average'] == new_avg:
            print("SUCCESS: List endpoint returned fresh data.")
        else:
            print("FAILURE: List endpoint returned STALE data.")
            print(f"Expected: {new_avg}, Got: {updated_rc['average']}")
    else:
        print("Target RC not found in second list fetch.")

if __name__ == "__main__":
    test_list_consistency()
