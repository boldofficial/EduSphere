from django.core.management.base import BaseCommand
from schools.models import SubscriptionPlan, PlatformModule, PlatformSettings, MODULES

class Command(BaseCommand):
    help = 'Seeds global platform data (Plans, Modules, Settings)'

    def handle(self, *args, **options):
        self.stdout.write("Seeding platform data...")

        # 1. Sync Modules
        PlatformModule.sync_from_registry()
        self.stdout.write(self.style.SUCCESS("✅ Platform modules synchronized."))

        # 2. Setup Default Plans
        all_module_ids = [m['id'] for m in MODULES]
        plans_data = [
            {
                'name': 'Basic Plan',
                'slug': 'basic',
                'price': 10000.00,
                'duration_days': 30,
                'description': 'Essential features for small schools.',
                'allowed_modules': ['students', 'attendance', 'announcements', 'calendar'],
            },
            {
                'name': 'Professional Plan',
                'slug': 'pro',
                'price': 25000.00,
                'duration_days': 30,
                'description': 'Advanced features for growing schools.',
                'allowed_modules': ['students', 'teachers', 'classes', 'grading', 'attendance', 'bursary', 'announcements', 'calendar'],
            },
            {
                'name': 'Enterprise Plan',
                'slug': 'enterprise',
                'price': 50000.00,
                'duration_days': 30,
                'description': 'Full access to all platform capabilities.',
                'allowed_modules': all_module_ids,
            }
        ]

        for p_data in plans_data:
            plan, created = SubscriptionPlan.objects.update_or_create(
                slug=p_data['slug'],
                defaults=p_data
            )
            status = "Created" if created else "Updated"
            self.stdout.write(f"  - {status} {plan.name}")

        # 3. Platform Settings
        PlatformSettings.objects.get_or_create(
            id=1,
            defaults={
                'support_email': 'support@boldideas.edu',
                'support_phone': '+234 800 123 4567',
                'bank_name': 'Bold Bank',
                'account_name': 'Bold Ideas Innovations',
                'account_number': '0011223344'
            }
        )
        self.stdout.write(self.style.SUCCESS("✅ Global platform settings initialized."))
        self.stdout.write(self.style.SUCCESS("Platform seeding complete!"))
