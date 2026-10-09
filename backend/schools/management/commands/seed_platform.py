from django.core.management.base import BaseCommand

from schools.models import PlatformModule, PlatformSettings, SubscriptionPlan
from schools.plans import PLAN_CATALOG


class Command(BaseCommand):
    help = "Seeds global platform data (Plans, Modules, Settings)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding platform data...")

        # 1. Sync Modules
        PlatformModule.sync_from_registry()
        self.stdout.write(self.style.SUCCESS("✅ Platform modules synchronized."))

        # 2. Annual subscription plans (one academic year = 3 terms)
        for p_data in PLAN_CATALOG:
            defaults = {k: v for k, v in p_data.items() if k != "slug"}
            defaults.update(duration_days=365, is_active=True)
            plan, created = SubscriptionPlan.objects.update_or_create(slug=p_data["slug"], defaults=defaults)
            status = "Created" if created else "Updated"
            self.stdout.write(f"  - {status} {plan.name}")

        # 3. Platform Settings
        PlatformSettings.objects.get_or_create(
            id=1,
            defaults={
                "support_email": "support@boldideas.edu",
                "support_phone": "+234 800 123 4567",
                "bank_name": "Bold Bank",
                "account_name": "Bold Ideas Innovations",
                "account_number": "0011223344",
            },
        )
        self.stdout.write(self.style.SUCCESS("✅ Global platform settings initialized."))
        self.stdout.write(self.style.SUCCESS("Platform seeding complete!"))
