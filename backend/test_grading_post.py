import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academic.models import Student, Class
from academic.serializers import ReportCardSerializer

def test_post():
    student = Student.objects.filter(student_no='002').first()
    cls = student.current_class
    
    data = {
        "student_id": student.id,
        "class_id": cls.id,
        "session": "2025/2026",
        "term": "Second Term",
        "rows": [
            { "subject": "Mathematics", "ca1": 15, "ca2": 20, "exam": 55, "total": 90, "grade": "A", "comment": "Excellent" }
        ],
        "average": 90,
        "total_score": 90
    }
    
    serializer = ReportCardSerializer(data=data)
    if serializer.is_valid():
        # Mocking the request.user and request.tenant
        from users.models import User
        admin = User.objects.filter(role='SUPER_ADMIN').first() or User.objects.first()
        print(f"Using admin user: {admin.username}, school: {admin.school}")
        
        if not admin.school:
            from schools.models import School
            school = School.objects.first()
            print(f"Admin has no school, using first school found: {school}")
        else:
            school = admin.school
            
        instance = serializer.save(school=school)
        print(f"Successfully created/updated report card: {instance.id}")
        
        # Verify auto-calculation
        instance.refresh_from_db()
        print(f"Report Card Average: {instance.average}")
        print(f"Report Card Total Score: {instance.total_score}")
        
        score = instance.scores.first()
        if score:
            print(f"Subject Score Total: {score.total}")
            print(f"Subject Score Grade: {score.grade}")
            
    else:
        print("Validation errors:")
        print(json.dumps(serializer.errors, indent=2))

if __name__ == "__main__":
    test_post()
