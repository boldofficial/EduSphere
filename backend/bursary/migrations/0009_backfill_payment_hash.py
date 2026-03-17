import uuid
from django.db import migrations

def backfill_payment_hashes(apps, schema_editor):
    Payment = apps.get_model('bursary', 'Payment')
    for payment in Payment.objects.all():
        if not payment.payment_hash:
            payment.payment_hash = uuid.uuid4()
            payment.save(update_fields=['payment_hash'])

class Migration(migrations.Migration):
    dependencies = [
        ('bursary', '0008_feecategory_allow_partial_payments_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_payment_hashes, elidable=True),
    ]
