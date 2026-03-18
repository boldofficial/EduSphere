import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from emails.models import EmailLog
from emails.serializers import EmailLogSerializer

try:
    logs = list(EmailLog.objects.all()[:5])
    print(f'Found {len(logs)} logs')
    for log in logs:
        EmailLogSerializer(log).data
    print('Serialization successful')
except Exception as e:
    import traceback
    traceback.print_exc()
