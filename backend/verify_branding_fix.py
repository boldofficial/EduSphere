import os
import django
import json
from django.test import RequestFactory
from django.contrib.auth import get_user_model

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.views import SettingsView
from schools.models import School, SchoolSettings

def verify():
    print("--- Starting Branding & Logo Fix Verification ---")
    
    # Get or create a dummy school
    school, created = School.objects.get_or_create(
        domain='verify-test',
        defaults={'name': 'Verify Test School', 'logo': 'passports/test-logo.png'}
    )
    if not created:
        school.logo = 'passports/test-logo.png'
        school.save()
        
    settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
    settings_obj.watermark_media = 'passports/test-watermark.png'
    settings_obj.save()

    print(f"School: {school.name}")
    print(f"Initial Logo path: {school.logo}")
    print(f"Initial Watermark path: {settings_obj.watermark_media}")

    # Simulate GET request
    factory = RequestFactory()
    request = factory.get('/api/settings/', HTTP_X_TENANT_ID='verify-test')
    
    # We need to mock a user or ensure the view handles unauthenticated (it does in my change)
    view = SettingsView.as_view()
    response = view(request)
    
    print(f"Response Status: {response.status_code}")
    data = response.data
    
    logo_media = data.get('logo_media')
    watermark_media = data.get('watermark_media')
    
    print(f"Returned logo_media: {logo_media}")
    print(f"Returned watermark_media: {watermark_media}")

    success = True
    if not logo_media or not logo_media.startswith('http'):
        print("FAILED: logo_media is not a URL or is missing.")
        success = False
    if not watermark_media or not watermark_media.startswith('http'):
        print("FAILED: watermark_media is not a URL or is missing.")
        success = False

    if success:
        print("\nSUCCESS: Media URLs are correctly resolved!")
    else:
        print("\nFAILURE: One or more media URLs failed to resolve.")

if __name__ == "__main__":
    verify()
