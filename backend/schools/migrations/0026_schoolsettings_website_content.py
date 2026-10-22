from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("schools", "0025_annual_plan_tiers")]

    operations = [
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_about_eyebrow",
            field=models.CharField(blank=True, default="Who we are", max_length=100),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_about_title",
            field=models.CharField(blank=True, default="A tradition of excellence", max_length=255),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_about_html",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_about_primary_image",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_about_secondary_image",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_about_image_position",
            field=models.CharField(default="left", max_length=10),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_custom_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_custom_html",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_custom_css",
            field=models.TextField(blank=True, null=True),
        ),
    ]
