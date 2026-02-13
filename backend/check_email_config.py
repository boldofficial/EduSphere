import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import PlatformSettings

p = PlatformSettings.objects.first()
if p:
    print(f"Provider: {p.email_provider}")
    print(f"Email From: {p.email_from}")
    print(f"API Key Length: {len(p.email_api_key) if p.email_api_key else 0}")
    print(f"SMTP Host: {p.email_host}")
    print(f"SMTP User: {p.email_user}")
    if p.email_api_key:
        print(f"API Key starts with: {p.email_api_key[:10]}...")
else:
    print("No PlatformSettings found.")
