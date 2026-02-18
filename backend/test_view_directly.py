
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.views_public import PublicPlanListView
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/api/schools/plans/')
view = PublicPlanListView.as_view()
response = view(request)

print(f"Status Code: {response.status_code}")
print(f"Data: {response.data}")
