
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()
url = '/api/schools/plans/'
response = client.get(url)

print(f"URL: {url}")
print(f"Status Code: {response.status_code}")
print(f"Content (First 500 chars):")
print(response.content.decode()[:500])
