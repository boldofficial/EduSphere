import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from schools.models import School

User = get_user_model()

from academic.models import Teacher, Class, Student, Subject

# ... (Previous imports)

def seed():
    # Create Default School
    school, created = School.objects.get_or_create(
        name="Demo School",
        defaults={'domain': 'demo'}
    )
    if created:
        print(f"Created school: {school.name}")
    else:
        print(f"School already exists: {school.name}")

    # Create Superuser
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
        admin.school = school
        admin.save()
        print("Created superuser: admin/admin")
    else:
        print("Superuser 'admin' already exists")

    # Create Teacher User & Profile
    if not User.objects.filter(username='teacher1').exists():
        t_user = User.objects.create_user('teacher1', 'teacher@example.com', 'teacher123', role='teacher', school=school)
        teacher, _ = Teacher.objects.get_or_create(
            user=t_user,
            defaults={'name': 'John Doe', 'email': 'teacher@example.com', 'school': school}
        )
        print(f"Created teacher: {teacher.name}")
    
    # Create Class
    cls, _ = Class.objects.get_or_create(name="Primary 1", school=school)
    
    # Create Student
    if not User.objects.filter(username='student1').exists():
        s_user = User.objects.create_user('student1', 'student@example.com', 'student123', role='student', school=school)
        student, _ = Student.objects.get_or_create(
            user=s_user,
            student_no='ST001',
            defaults={
                'names': 'Alice Wonderland',
                'gender': 'Female',
                'current_class': cls,
                'parent_name': 'Mrs. Wonderland',
                'school': school
            }
        )
        print(f"Created student: {student.names}")

if __name__ == '__main__':
    seed()
