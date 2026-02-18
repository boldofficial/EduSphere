
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import resolve, Resolver404

url = '/api/schools/plans/'
try:
    match = resolve(url)
    print(f"URL Resolve for {url}:")
    print(f"  View Name: {match.view_name}")
    print(f"  App Name: {match.app_name}")
    print(f"  Namespace: {match.namespace}")
    print(f"  Callback: {match.func}")
except Resolver404:
    print(f"URL Resolve for {url}: NOT FOUND (Resolver404)")
except Exception as e:
    print(f"URL Resolve for {url}: ERROR: {e}")
