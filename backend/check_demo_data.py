import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import School
from academic.models import Student

def check_demo_students():
    print("Checking Demo School...")
    demo_school = School.objects.filter(domain='demo').first()
    if not demo_school:
        print("Demo school not found (domain='demo')")
        return

    print(f"Found Demo School: {demo_school.name} (ID: {demo_school.id})")
    students = Student.objects.filter(school=demo_school)
    print(f"Student count for demo school: {students.count()}")
    
    if students.count() > 0:
        print("First 5 students:")
        for s in students[:5]:
            print(f"- {s.names} ({s.student_no})")
    else:
        print("No students found for this school.")
        
    all_schools = School.objects.all()
    print("\nAll schools in DB:")
    for s in all_schools:
        print(f"- {s.name} (domain: {s.domain}, ID: {s.id})")

if __name__ == "__main__":
    check_demo_students()
