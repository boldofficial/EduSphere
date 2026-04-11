# Generated migration for performance indexes
# Run: python manage.py migrate academic

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "academic",
            "0024_remove_subjectscore_academic_su_school__e95787_idx_and_more",
        ),
    ]

    operations = [
        # ===============================
        # Student Model Indexes
        # ===============================
        migrations.AddIndex(
            model_name="student",
            index=models.Index(fields=["current_class"], name="ac_student_class_idx"),
        ),
        migrations.AddIndex(
            model_name="student",
            index=models.Index(fields=["student_no"], name="ac_student_no_idx"),
        ),
    ]
