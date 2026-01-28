import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append('c:\\Users\\HomePC\\Documents\\school_manager02\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academic.models import Teacher
from schools.models import School
from rest_framework.test import APIRequestFactory, force_authenticate
from academic.views import TeacherViewSet
from users.models import User

import traceback
import time

def verify():
    print("Starting Teacher and Staff separation verification...")
    try:
        _verify_logic()
    except Exception:
        traceback.print_exc()

def _verify_logic():
    school = School.objects.first()
    if not school:
        school = School.objects.create(name="Test School", domain="test")
        print(f"Created test school: {school}")

    # Use SCHOOL_ADMIN as per users.models.User.Role
    admin_user = User.objects.filter(role='SCHOOL_ADMIN', school=school).first()
    if not admin_user:
        admin_user = User.objects.create_user(
            username=f"admin_{int(time.time())}", 
            password="password123",
            role='SCHOOL_ADMIN',
            school=school
        )
        print(f"Created admin user: {admin_user}")

    factory = APIRequestFactory()
    view = TeacherViewSet.as_view({'get': 'list', 'post': 'create'})

    timestamp = int(time.time())
    
    # 1. Create Academic Teacher
    print(f"\n--- Step 1: Create Academic Teacher ({timestamp}) ---")
    teacher_name = f"Academic Teacher {timestamp}"
    data_teacher = {
        "name": teacher_name,
        "email": f"teacher-{timestamp}@school.com",
        "phone": str(timestamp),
        "address": "Academic St",
    }
    request = factory.post('/api/teachers/', data_teacher, format='json')
    force_authenticate(request, user=admin_user)
    # Mock tenant on request as the middleware would
    request.tenant = school 
    
    response = view(request)
    print(f"Create Teacher Response Status: {response.status_code}")
    if response.status_code == 201:
        teacher_id = response.data['id']
        print(f"Teacher created with ID: {teacher_id}")
    else:
        print(f"Failed to create teacher. Status: {response.status_code}")
        print(f"Error: {response.data}")
        return

    # 2. Create Non-Academic Staff
    print(f"\n--- Step 2: Create Non-Academic Staff ({timestamp}) ---")
    staff_name = f"Bursar Staff {timestamp}"
    data_staff = {
        "name": staff_name,
        "email": f"bursar-{timestamp}@school.com",
        "phone": str(timestamp + 1),
        "address": "Admin St",
        "role": "Bursar",
        "tasks": "Manage school finances",
        "assigned_modules": ["bursary", "payments"]
    }
    request = factory.post('/api/staff/', data_staff, format='json')
    force_authenticate(request, user=admin_user)
    request.tenant = school
    
    response = view(request)
    print(f"Create Staff Response Status: {response.status_code}")
    if response.status_code == 201:
        staff_id = response.data['id']
        print(f"Staff created with ID: {staff_id}")
        
        # Verify fields in response
        if response.data.get('role') == "Bursar" and response.data.get('staff_type') == "NON_ACADEMIC":
            print("SUCCESS: Staff fields and type correctly assigned.")
        else:
            print(f"FAILURE: Staff fields or type mismatch. Got: {response.data}")
    else:
        print(f"Failed to create staff. Status: {response.status_code}")
        print(f"Error: {response.data}")
        return

    # 3. Verify List Filtering
    print("\n--- Step 3: Verify List Filtering ---")
    
    # Teachers list
    request = factory.get('/api/teachers/')
    force_authenticate(request, user=admin_user)
    request.tenant = school
    response = view(request)
    teachers_list = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
    teacher_names = [t['name'] for t in teachers_list]
    print(f"Found {len(teacher_names)} teachers. Latest: {teacher_names[-1] if teacher_names else 'None'}")
    
    # Staff list
    request = factory.get('/api/staff/')
    force_authenticate(request, user=admin_user)
    request.tenant = school
    response = view(request)
    staff_list = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
    staff_names = [s['name'] for s in staff_list]
    print(f"Found {len(staff_names)} staff. Latest: {staff_names[-1] if staff_names else 'None'}")

    if teacher_name in teacher_names and staff_name not in teacher_names:
        print("SUCCESS: Teachers list correctly filtered.")
    else:
        print(f"FAILURE: Teachers list filtering issue. Expected {teacher_name} to be in {teacher_names} and {staff_name} NOT to be in it.")

    if staff_name in staff_names and teacher_name not in staff_names:
        print("SUCCESS: Staff list correctly filtered.")
    else:
        print(f"FAILURE: Staff list filtering issue. Expected {staff_name} to be in {staff_names} and {teacher_name} NOT to be in it.")

    print("\nVerification Complete.")

if __name__ == "__main__":
    verify()
