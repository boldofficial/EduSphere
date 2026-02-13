import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from emails.models import EmailLog

def dump_logs():
    logs = EmailLog.objects.order_by('-sent_at')[:5]
    print(f"Found {len(logs)} logs.")
    for l in logs:
        print(f"--- Log ID: {l.id} ---")
        print(f"Time: {l.sent_at}")
        print(f"Recipient: {l.recipient}")
        print(f"Status: {l.status}")
        print(f"Error: {l.error_message}")
        print(f"Metadata: {l.metadata}")
        print("-" * 20)

if __name__ == '__main__':
    dump_logs()
