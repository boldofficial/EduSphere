import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("schools", "0027_schoolsettings_landing_sections")]

    operations = [
        migrations.CreateModel(
            name="WebsiteMedia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("path", models.CharField(max_length=255)),
                ("thumb_path", models.CharField(blank=True, max_length=255)),
                ("width", models.PositiveIntegerField(default=0)),
                ("height", models.PositiveIntegerField(default=0)),
                ("size_bytes", models.PositiveIntegerField(default=0)),
                ("alt_text", models.CharField(blank=True, max_length=200)),
                ("caption", models.CharField(blank=True, max_length=300)),
                ("album", models.CharField(blank=True, max_length=80)),
                ("show_in_gallery", models.BooleanField(default=True)),
                ("position", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="website_media",
                        to="schools.school",
                    ),
                ),
            ],
            options={
                "ordering": ["position", "-created_at"],
                "indexes": [
                    models.Index(
                        fields=["school", "show_in_gallery", "position"], name="schools_web_school__65635c_idx"
                    )
                ],
            },
        ),
    ]
