from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academic", "0025_performance_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="class",
            name="report_mode",
            field=models.CharField(
                choices=[
                    ("numeric", "Numeric Scores"),
                    ("early_years", "Early Years Narrative"),
                    ("hybrid", "Hybrid (Scores + Narrative)"),
                ],
                default="numeric",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="reportcard",
            name="early_years_observations",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Early-years narrative observations per learning area.",
            ),
        ),
    ]
