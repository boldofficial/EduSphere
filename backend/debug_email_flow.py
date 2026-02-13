import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from emails.models import EmailTemplate, EmailLog
from schools.models import PlatformSettings, DemoRequest

def debug():
    results = []
    
    # 1. Check Platform Settings
    p_settings = PlatformSettings.objects.first()
    if not p_settings:
        results.append("❌ PlatformSettings.objects.first() is None! This will cause AttributeError in send_template_email.")
    else:
        results.append(f"✅ PlatformSettings found. Provider: {p_settings.email_provider}")
        results.append(f"   From Email: {p_settings.email_from}")
        results.append(f"   Has API Key: {'Yes' if p_settings.email_api_key else 'No'}")

    # 2. Check Template
    try:
        template = EmailTemplate.objects.get(slug='demo-approved')
        results.append(f"✅ EmailTemplate 'demo-approved' found.")
    except EmailTemplate.DoesNotExist:
        results.append("❌ EmailTemplate 'demo-approved' NOT found.")

    # 3. Check Recent Demos
    recent_demos = DemoRequest.objects.order_by('-updated_at')[:3]
    results.append(f"Found {len(recent_demos)} recent demo requests.")
    for d in recent_demos:
        results.append(f"   Demo: {d.email}, Status: {d.status}, Updated: {d.updated_at}")

    # 4. Check Recent Logs
    recent_logs = EmailLog.objects.order_by('-created_at')[:5]
    results.append(f"Found {len(recent_logs)} recent email logs.")
    for l in recent_logs:
        results.append(f"   Log: {l.recipient}, Status: {l.status}, Error: {l.error_message[:100]}")

    with open('email_debug_out.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(results))
    print("Debug complete. Output written to email_debug_out.txt")

if __name__ == '__main__':
    debug()
