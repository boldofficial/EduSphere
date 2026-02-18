
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse

client = Client()
url = '/api/schools/plans/'
response = client.get(url)

print(f"Testing URL: {url}")
print(f"Status Code: {response.status_code}")
print(f"Response Data: {response.content.decode()}")

# Also check if plans exist
from schools.models import SubscriptionPlan
plans_count = SubscriptionPlan.objects.count()
print(f"Total Plans in DB: {plans_count}")

if plans_count == 0:
    print("WARNING: No plans found in database. You might need to seed them.")
