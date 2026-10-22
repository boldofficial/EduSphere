from django.db import migrations, models


def _section(key, **extra):
    return {"id": key, "key": key, "title": "", "enabled": True, "use_custom": False, "html": "", "css": "", **extra}


def move_custom_block(apps, schema_editor):
    SchoolSettings = apps.get_model("schools", "SchoolSettings")
    for settings in SchoolSettings.objects.exclude(landing_custom_html__isnull=True).exclude(landing_custom_html=""):
        settings.landing_sections = [
            _section("hero"),
            _section("about"),
            _section("values"),
            _section("programs"),
            _section("cta"),
            _section(
                "custom",
                id="custom-1",
                title="Custom section",
                enabled=bool(settings.landing_custom_enabled),
                use_custom=True,
                html=settings.landing_custom_html or "",
                css=settings.landing_custom_css or "",
            ),
            _section("contact"),
        ]
        settings.save(update_fields=["landing_sections"])


class Migration(migrations.Migration):
    dependencies = [("schools", "0026_schoolsettings_website_content")]

    operations = [
        migrations.AddField(
            model_name="schoolsettings",
            name="landing_sections",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(move_custom_block, migrations.RunPython.noop),
    ]
