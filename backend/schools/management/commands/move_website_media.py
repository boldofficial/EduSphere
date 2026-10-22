"""
One-off: move existing website images (logo, hero, about, programs, testimonials) from the private
passports/ folder to website/<school>/ so they get permanent public addresses.

    python manage.py move_website_media --dry-run
    python manage.py move_website_media

Safe to re-run: images already under website/ are skipped. Originals are left in place.
"""

from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from core.website_media import is_website_path, save_website_image
from schools.models import School, SchoolSettings

SETTINGS_IMAGE_FIELDS = ("landing_hero_image", "landing_about_primary_image", "landing_about_secondary_image")


class Command(BaseCommand):
    help = "Move existing website images to permanent public storage."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Report what would move without changing anything.")
        parser.add_argument("--school", help="Only this school domain.")

    def handle(self, *args, dry_run=False, school=None, **options):
        self.dry_run = dry_run
        self.moved = self.failed = 0
        schools = School.objects.all()
        if school:
            schools = schools.filter(domain=school)
        for item in schools.iterator():
            self.move_school(item)
        verb = "Would move" if dry_run else "Moved"
        self.stdout.write(self.style.SUCCESS(f"{verb} {self.moved} image(s); {self.failed} could not be moved."))

    def convert(self, school, path, logo=False):
        """New website path for `path`, or the original when it can't (or needn't) be moved."""
        if not path or not isinstance(path, str) or is_website_path(path) or path.startswith(("http", "data:")):
            return path
        if self.dry_run:
            self.moved += 1
            self.stdout.write(f"  {school.domain}: {path}")
            return path
        try:
            with default_storage.open(path, "rb") as handle:
                new_path = save_website_image(school.pk, handle.read(), logo=logo)["path"]
        except Exception as error:  # a missing or broken file keeps its old (still working) path
            self.failed += 1
            self.stderr.write(f"  {school.domain}: {path} — {error}")
            return path
        self.moved += 1
        return new_path

    def move_school(self, school):
        new_logo = self.convert(school, school.logo, logo=True)
        if new_logo != school.logo:
            school.logo = new_logo
            school.save(update_fields=["logo"])

        settings = SchoolSettings.objects.filter(school=school).first()
        if not settings:
            return
        changed = []
        for field in SETTINGS_IMAGE_FIELDS:
            value = getattr(settings, field)
            new = self.convert(school, value)
            if new != value:
                setattr(settings, field, new)
                changed.append(field)
        for field in ("landing_academic_programs", "landing_testimonials"):
            items = getattr(settings, field) or []
            touched = False
            for entry in items:
                if isinstance(entry, dict) and entry.get("image"):
                    new = self.convert(school, entry["image"])
                    if new != entry["image"]:
                        entry["image"] = new
                        touched = True
            if touched:
                changed.append(field)
        if changed and not self.dry_run:
            settings.save(update_fields=changed)
