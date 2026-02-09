import os
import django
import sys
from pathlib import Path

# Add the backend directory to sys.path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model

def debug_auth():
    print("--- Environment Debug ---")
    print(f"DATABASE_URL in env: {os.environ.get('DATABASE_URL')}")
    print(f"DB Engine: {settings.DATABASES['default']['ENGINE']}")
    print(f"DB Name: {settings.DATABASES['default']['NAME']}")
    
    print("\n--- Auth Test ---")
    test_email = 'admin@example.com'
    test_pass = 'admin123'
    
    User = get_user_model()
    try:
        user = User.objects.get(email=test_email)
        print(f"User found: {user.email}")
        print(f"Active: {user.is_active}, Staff: {user.is_staff}, Superuser: {user.is_superuser}")
        
        # Test direct authenticate
        auth_user = authenticate(username=test_email, password=test_pass)
        print(f"Direct authenticate(email, pass) result: {'SUCCESS' if auth_user else 'FAILURE'}")
        
    except User.DoesNotExist:
        print(f"Error: User {test_email} not found in this database!")

if __name__ == "__main__":
    debug_auth()
