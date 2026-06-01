from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("feedback", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="feedback",
            name="guest_name",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="feedback",
            name="guest_email",
            field=models.EmailField(blank=True),
        ),
    ]
