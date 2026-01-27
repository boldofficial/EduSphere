import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = 'sholemsreal@gmail.com'
password = 'DamiShow@1982'
username = 'sholemsreal'

try:
    if not User.objects.filter(email=email).exists():
        print(f"Creating superuser {username}...")
        # Create standard superuser first
        user = User.objects.create_superuser(username=username, email=email, password=password)
        
        # Explicitly set the role to SUPER_ADMIN
        user.role = 'SUPER_ADMIN'
        user.save()
        
        print(f"SUCCESS: Superuser '{username}' ({email}) created with role SUPER_ADMIN.")
    else:
        user = User.objects.get(email=email)
        user.set_password(password)
        user.role = 'SUPER_ADMIN'
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"UPDATED: User '{username}' ({email}) reset to password provided and role SUPER_ADMIN.")

except Exception as e:
    print(f"ERROR: {str(e)}")
