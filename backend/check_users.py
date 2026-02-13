import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users = User.objects.all()
print(f"TOTAL_USERS:{users.count()}")
for u in users:
    print(f"ID:{u.id}|USERNAME:{u.username}|EMAIL:{u.email}|ROLE:{u.role}")
