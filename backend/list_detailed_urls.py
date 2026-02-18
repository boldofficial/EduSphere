
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLResolver, URLPattern

def print_patterns(urlpatterns, prefix=''):
    for pattern in urlpatterns:
        if isinstance(pattern, URLResolver):
            full_prefix = prefix + str(pattern.pattern)
            print(f"Resolver: {full_prefix}")
            print_patterns(pattern.url_patterns, full_prefix)
        elif isinstance(pattern, URLPattern):
            print(f"Pattern: {prefix}{str(pattern.pattern)} -> {pattern.name}")

print_patterns(get_resolver().url_patterns)
