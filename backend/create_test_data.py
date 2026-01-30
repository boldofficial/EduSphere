import os
import sys
import django

# Add the project directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from academic.models import SubjectTeacher, Class, Teacher
try:
    from core.models import GlobalSettings
except ImportError:
    try:
        from schools.models import GlobalSettings
    except ImportError:
        GlobalSettings = None
        print("GlobalSettings not found in core or schools")

def create_data():
    if GlobalSettings:
        settings = GlobalSettings.objects.filter(school_id=9).first()
        session = settings.current_session if settings else '2024/2025'
    else:
        # Fallback: try to find any existing object with session
        session = '2024/2025'
    
    print(f"Using Session: {session}")
    
    # Check if assignment already exists
    current = SubjectTeacher.objects.filter(
        school_id=9, 
        teacher_id=16, 
        student_class_id=21, 
        subject='Mathematics'
    ).first()
    
    if current:
        print(f"Assignment already exists: {current}")
        return

    try:
        assignment = SubjectTeacher.objects.create(
            school_id=9, 
            teacher_id=16, 
            student_class_id=21, 
            subject='Mathematics', 
            session=session
        )
        print(f"Successfully Created Assignment: {assignment}")
    except Exception as e:
        print(f"Error creating assignment: {e}")

if __name__ == '__main__':
    create_data()
