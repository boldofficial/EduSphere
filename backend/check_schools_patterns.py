
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLResolver

def find_schools_resolver(resolver):
    for pattern in resolver.url_patterns:
        if isinstance(pattern, URLResolver) and 'api/schools/' in str(pattern.pattern):
            return pattern
    return None

resolver = get_resolver()
schools_resolver = find_schools_resolver(resolver)

if schools_resolver:
    print("Found schools resolver!")
    for pattern in schools_resolver.url_patterns:
        print(f" Pattern: {pattern.pattern} -> {pattern.callback}")
else:
    print("Schools resolver NOT found in root patterns!")
