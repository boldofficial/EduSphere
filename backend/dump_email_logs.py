import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from emails.models import EmailLog
from schools.models import PlatformSettings

def dump():
    with open('email_config_dump.txt', 'w', encoding='utf-8') as f:
        f.write("=== PLATFORM SETTINGS ===\n")
        p = PlatformSettings.objects.first()
        if p:
            f.write(f"Provider: {p.email_provider}\n")
            f.write(f"Host: {p.email_host}\n")
            f.write(f"Port: {p.email_port}\n")
            f.write(f"User: {p.email_user}\n")
            f.write(f"From: {p.email_from}\n")
            f.write(f"Has Password: {'Yes' if p.email_password else 'No'}\n")
            f.write(f"Has API Key: {'Yes' if p.email_api_key else 'No'}\n")
        else:
            f.write("No PlatformSettings found.\n")

        f.write("\n=== EMAIL LOGS (LAST 10) ===\n")
        logs = EmailLog.objects.order_by('-sent_at')[:10]
        for l in logs:
            f.write(f"[{l.sent_at}] To: {l.recipient} | Status: {l.status}\n")
            f.write(f"Error: {l.error_message}\n")
            f.write("-" * 40 + "\n")

if __name__ == '__main__':
    dump()
