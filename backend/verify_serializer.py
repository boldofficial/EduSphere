import os
import django
import sys
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from academic.models import Student
from academic.serializers import StudentSerializer
from django.test import RequestFactory

def verify_serializer_update():
    print("--- Verifying StudentSerializer Update ---")
    
    # Get a test student
    student = Student.objects.first()
    if not student:
        print("No student found. Create one first.")
        return

    print(f"Testing with Student: {student.names}")
    
    # Mock payload from frontend
    payload = {
        'assigned_fees': ['test_fee_1', 'test_fee_2'],
        'discounts': [{'id': 'd1', 'amount': 1000, 'reason': 'Test', 'category': 'discount', 'session': '2025/2026', 'term': 'First Term'}]
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # Init serializer with partial=True
    serializer = StudentSerializer(student, data=payload, partial=True)
    
    if serializer.is_valid():
        print("[PASS] Serializer is valid.")
        updated_student = serializer.save()
        print(f"Saved assigned_fees: {updated_student.assigned_fees}")
        print(f"Saved discounts: {updated_student.discounts}")
        
        # Verify persistence
        updated_student.refresh_from_db()
        if updated_student.assigned_fees == payload['assigned_fees']:
            print("[SUCCESS] Data persisted correctly via Serializer.")
        else:
            print("[FAIL] Persistence mismatch!")
    else:
        print(f"[FAIL] Serializer errors: {serializer.errors}")

if __name__ == '__main__':
    verify_serializer_update()
