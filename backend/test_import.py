import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

try:
    from emails.models import EmailTemplate
    print("SUCCESS: EmailTemplate imported successfully")
except Exception as e:
    print(f"FAILURE: {e}")
