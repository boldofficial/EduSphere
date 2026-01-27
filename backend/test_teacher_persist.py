import base64
import json

# Minimal base64 pixel (transparent 1x1 png)
BASE64_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/xwAAwcA8QSqSgAAAABJRU5ErkJggg=="

# print("Testing Base64ImageField logic in isolation...")
try:
    from django.conf import settings
    import os
    import sys

    # Setup Django environment to test serializer in isolation
    sys.path.append('c:\\Users\\HomePC\\Documents\\school_manager02\\backend')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    import django
    django.setup()

    from academic.serializers import TeacherSerializer
    from academic.models import Teacher
    from schools.models import School

    school = School.objects.first()
    if not school:
        print("No school found to test with.")
    else:
        data = {
            "name": "Test Teacher Persistence",
            "email": "test-persist@school.com",
            "phone": "123456789",
            "address": "123 Test St",
            "passport_url": BASE64_PIXEL,
            "school": school.pk
        }
        
        serializer = TeacherSerializer(data=data)
        if serializer.is_valid():
            teacher = serializer.save(school=school)
            print(f"Success! Teacher created with ID: {teacher.id}")
            print(f"DB passport_url (should be path): {teacher.passport_url}")
            
            # Re-fetch through serializer to see represented URL
            rep = TeacherSerializer(teacher).data
            print(f"Represented passport_url (should be full URL): {rep['passport_url']}")
            
            if not teacher.passport_url.startswith('http') and 'passports/' in teacher.passport_url:
                print("DB PERSISTENCE VERIFIED: Relative path stored.")
            else:
                print("FAILURE: DB still storing full URL or invalid path.")
                
            if rep['passport_url'].startswith('http') or rep['passport_url'].startswith('/media/'):
                print("REPRESENTATION VERIFIED: Dynamic URL generated.")
            else:
                print("FAILURE: Representation did not generate valid URL.")
            
            # Cleanup
            # teacher.delete()
        else:
            print(f"Serializer Invalid: {serializer.errors}")

except Exception as e:
    print(f"Diagnostic failed: {e}")
    import traceback
    traceback.print_exc()
