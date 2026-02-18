
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.core.cache import cache

print(f"DEBUG: {settings.DEBUG}")
print(f"REDIS_URL from settings: {getattr(settings, 'REDIS_URL', 'NOT SET')}")
print(f"CACHES['default']: {settings.CACHES.get('default', {})}")
print(f"CELERY_BROKER_URL: {getattr(settings, 'CELERY_BROKER_URL', 'NOT SET')}")
print(f"CELERY_RESULT_BACKEND: {getattr(settings, 'CELERY_RESULT_BACKEND', 'NOT SET')}")

print("\nTesting cache.get('test_key')...")
try:
    cache.get('test_key')
    print("SUCCESS: cache.get('test_key') worked without Redis error.")
except Exception as e:
    print(f"FAILURE: cache.get('test_key') failed with: {e}")

print("\nChecking environment variables:")
print(f"REDIS_URL in env: {os.environ.get('REDIS_URL')}")
