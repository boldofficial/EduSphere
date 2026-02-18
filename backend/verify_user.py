import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

user = User.objects.get(username='demo@myregistra.net')
serializer = UserSerializer(user)
data = serializer.data

print('--- USER SUBSCRIPTION DATA ---')
print(f"Plan: {data.get('subscription', {}).get('plan_name')}")
print(f"Status: {data.get('subscription', {}).get('status')}")
print(f"Allowed Modules: {data.get('subscription', {}).get('allowed_modules')}")
