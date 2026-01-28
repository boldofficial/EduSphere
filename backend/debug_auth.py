import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from users.models import User

username = 'sholemsreal@gmail.com'
password = 'admin123'

print(f"Testing auth for {username}...")

user = User.objects.filter(username=username).first()
if not user:
    print("User NOT FOUND in database!")
else:
    print(f"User FOUND: ID={user.id}, Role={user.role}, Active={user.is_active}")
    print(f"School: {user.school}")

    auth_user = authenticate(username=username, password=password)
    if auth_user:
        print("AUTHENTICATION SUCCESSFUL!")
    else:
        print("AUTHENTICATION FAILED!")
