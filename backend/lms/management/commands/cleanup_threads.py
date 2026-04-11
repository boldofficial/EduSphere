from django.core.management.base import BaseCommand
from django.db.models import Count
from lms.models import DiscussionThread

class Command(BaseCommand):
    help = 'Cleanup duplicate discussion threads before applying unique constraint'

    def handle(self, *args, **options):
        # Find duplicates (same school, content_type, object_id)
        duplicates = DiscussionThread.objects.values(
            'school_id', 'content_type_id', 'object_id'
        ).annotate(
            count=Count('id')
        ).filter(count__gt=1)

        self.stdout.write(f"Found {duplicates.count()} sets of duplicates.")

        for dup in duplicates:
            # Get all threads for this resource
            threads = DiscussionThread.objects.filter(
                school_id=dup['school_id'],
                content_type_id=dup['content_type_id'],
                object_id=dup['object_id']
            ).order_by('created_at')

            # Keep the oldest one, delete others
            primary_thread = threads[0]
            to_delete = threads[1:]
            
            self.stdout.write(f"Keeping Thread ID {primary_thread.id} for Resource {dup['object_id']}. Deleting {len(to_delete)} duplicates.")
            
            for t in to_delete:
                # Re-attach messages to the primary thread before deleting (optional but safe)
                t.messages.all().update(thread=primary_thread)
                t.delete()

        self.stdout.write(self.style.SUCCESS('Successfully cleaned up duplicate threads.'))
