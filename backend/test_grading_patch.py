import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academic.models import ReportCard, Subject, Student
from academic.serializers import ReportCardSerializer

def test_patch():
    # Ensure ID 1 exists
    
    rc = ReportCard.objects.first()
    if not rc:
        print("No report card found to update.")
        return

    print(f"Testing PATCH on ReportCard ID: {rc.id}")

    data = {
        "rows": [
            { "subject": "Mathematics", "ca1": 20, "ca2": 20, "exam": 60, "total": 100, "grade": "A", "comment": "Perfect" }
        ],
        "school": rc.school.id if rc.school else None
    }
    
    # Simulate Partial Update
    serializer = ReportCardSerializer(rc, data=data, partial=True)
    if serializer.is_valid():
        try:
            instance = serializer.save()
            print("PATCH Successful!")
            print(f"Updated Average: {instance.average}")
            print(f"Updated Total: {instance.total_score}")
        except Exception as e:
            import traceback
            print(f"PATCH Failed with Exception: {e}")
            traceback.print_exc()
    else:
        print("Validation Errors:")
        print(serializer.errors)

if __name__ == "__main__":
    test_patch()
