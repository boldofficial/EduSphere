
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()
urls = [
    '/api/schools/plans/',
    '/api/schools/plans',
    '/api/schools/list/',
    '/api/schools/verify-slug/test/',
    '/api/token/',
]

for url in urls:
    response = client.get(url)
    print(f"URL: {url} -> Status Code: {response.status_code}")
    if response.status_code != 404:
        print(f"  Match found for {url}!")
