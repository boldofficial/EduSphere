from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("schools", "0020_subscriptionplan_custom_domain_enabled"),
    ]

    operations = [
        migrations.CreateModel(
            name="SchoolPaymentConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enable_cash", models.BooleanField(default=True)),
                ("enable_bank_transfer", models.BooleanField(default=True)),
                ("enable_paystack", models.BooleanField(default=False)),
                ("enable_flutterwave", models.BooleanField(default=False)),
                (
                    "default_payment_method",
                    models.CharField(
                        choices=[
                            ("cash", "Cash"),
                            ("bank_transfer", "Bank Transfer"),
                            ("paystack", "Paystack"),
                            ("flutterwave", "Flutterwave"),
                        ],
                        default="bank_transfer",
                        max_length=20,
                    ),
                ),
                ("paystack_public_key", models.CharField(blank=True, max_length=255, null=True)),
                ("paystack_secret_key", models.CharField(blank=True, max_length=255, null=True)),
                ("paystack_webhook_secret", models.CharField(blank=True, max_length=255, null=True)),
                ("flutterwave_public_key", models.CharField(blank=True, max_length=255, null=True)),
                ("flutterwave_secret_key", models.CharField(blank=True, max_length=255, null=True)),
                ("flutterwave_webhook_secret", models.CharField(blank=True, max_length=255, null=True)),
                ("bank_name", models.CharField(blank=True, max_length=255, null=True)),
                ("bank_account_name", models.CharField(blank=True, max_length=255, null=True)),
                ("bank_account_number", models.CharField(blank=True, max_length=30, null=True)),
                ("bank_sort_code", models.CharField(blank=True, max_length=20, null=True)),
                ("transfer_instructions", models.TextField(blank=True, null=True)),
                ("require_transfer_proof", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "school",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_config",
                        to="schools.school",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["default_payment_method"], name="schools_sch_default_81dd6f_idx"),
                    models.Index(fields=["updated_at"], name="schools_sch_updated_e4efe4_idx"),
                ],
            },
        ),
    ]
