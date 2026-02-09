import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

def check_db():
    print("--- Database Info ---")
    print(f"DB Engine: {connection.settings_dict['ENGINE']}")
    print(f"DB Name: {connection.settings_dict['NAME']}")
    print(f"DB User: {connection.settings_dict['USER']}")
    print(f"DB Host: {connection.settings_dict['HOST']}")
    print(f"DB Port: {connection.settings_dict['PORT']}")
    
    try:
        user_count = User.objects.count()
        print(f"\nTotal Users: {user_count}")
        if user_count > 0:
            print("\nUsers found:")
            for user in User.objects.all()[:5]:
                print(f"- {user.email} (Is Admin: {user.is_staff})")
        else:
            print("\nNo users found in the database.")
    except Exception as e:
        print(f"\nError accessing database: {e}")

if __name__ == "__main__":
    check_db()
