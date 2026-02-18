
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver

def show_urls(urls, depth=0):
    for entry in urls:
        if hasattr(entry, 'url_patterns'):
            print('  ' * depth + str(entry.pattern))
            show_urls(entry.url_patterns, depth + 1)
        else:
            print('  ' * depth + str(entry.pattern) + ' -> ' + entry.name if entry.name else '')

show_urls(get_resolver().url_patterns)
