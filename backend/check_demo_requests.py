import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import DemoRequest

requests = DemoRequest.objects.all()
print(f"TOTAL_REQUESTS:{requests.count()}")
for req in requests:
    print(f"ID:{req.id}|NAME:{req.name}|EMAIL:{req.email}|STATUS:{req.status}")
