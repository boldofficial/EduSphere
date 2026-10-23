from django.core.management.base import BaseCommand

from emails.defaults import DEFAULT_TEMPLATES
from emails.models import EmailTemplate


class Command(BaseCommand):
    help = (
        "Copy the built-in email templates into the database so super admins can edit them. "
        "Emails work without this; saved templates simply override the defaults."
    )

    def add_arguments(self, parser):
        parser.add_argument("--overwrite", action="store_true", help="Replace templates that already exist.")

    def handle(self, *args, overwrite=False, **options):
        for slug, data in DEFAULT_TEMPLATES.items():
            fields = {
                "name": data["name"],
                "subject": data["subject"],
                "body_html": data["body_html"].strip(),
                "variables": data["variables"],
            }
            if overwrite:
                _, created = EmailTemplate.objects.update_or_create(slug=slug, defaults=fields)
            else:
                _, created = EmailTemplate.objects.get_or_create(slug=slug, defaults=fields)
            verb = "Created" if created else ("Updated" if overwrite else "Kept existing")
            self.stdout.write(f"{verb}: {slug}")
