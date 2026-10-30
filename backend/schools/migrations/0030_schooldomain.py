from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


def preserve_existing_domains(apps, schema_editor):
    School = apps.get_model("schools", "School")
    SchoolDomain = apps.get_model("schools", "SchoolDomain")
    now = timezone.now()
    SchoolDomain.objects.bulk_create(
        [
            SchoolDomain(
                school_id=school.id,
                hostname=school.custom_domain.lower().rstrip("."),
                status="active",
                provider="legacy",
                hostname_status="active",
                certificate_status="active",
                activated_at=now,
            )
            for school in School.objects.exclude(custom_domain__isnull=True).exclude(custom_domain="")
        ],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):
    dependencies = [("schools", "0029_schoolsettings_landing_faqs_and_more")]

    operations = [
        migrations.CreateModel(
            name="SchoolDomain",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("hostname", models.CharField(max_length=253, unique=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Waiting for DNS"),
                            ("verifying", "Verifying"),
                            ("active", "Active"),
                            ("failed", "Configuration error"),
                            ("suspended", "Suspended"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("provider", models.CharField(default="cloudflare", max_length=30)),
                ("provider_hostname_id", models.CharField(blank=True, max_length=100)),
                ("hostname_status", models.CharField(blank=True, max_length=40)),
                ("certificate_status", models.CharField(blank=True, max_length=40)),
                ("validation_records", models.JSONField(blank=True, default=list)),
                ("failure_reason", models.TextField(blank=True)),
                ("last_checked_at", models.DateTimeField(blank=True, null=True)),
                ("activated_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "school",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_domain_setup",
                        to="schools.school",
                    ),
                ),
            ],
        ),
        migrations.RunPython(preserve_existing_domains, migrations.RunPython.noop),
    ]
