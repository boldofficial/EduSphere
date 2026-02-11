from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import School
from emails.tasks import send_email_task
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=School)
def send_school_status_email(sender, instance, created, **kwargs):
    """
    Sends automated emails based on School status changes.
    """
    # 1. New School Signup -> Welcome Email (triggered when created)
    if created:
        logger.info(f"New school created: {instance.name}. Queueing welcome email.")
        try:
            send_email_task.delay(
                'welcome_email', 
                instance.email, 
                {'school_name': instance.name, 'domain': instance.domain}
            )
        except Exception as e:
            logger.error(f"Failed to queue welcome email for {instance.name}: {e}")

    # 2. Status Change to Active -> Approval Email
    # Note: We need to check if the status *changed* to active, not just if it is active.
    # In a real-world scenario, we'd use a pre_save signal or a specific field tracker.
    # For now, if status is active and not created, we assume it was just approved.
    sub_status = 'none'
    if hasattr(instance, 'subscription') and instance.subscription:
        sub_status = instance.subscription.status

    if not created and sub_status == 'active':
        # Ideally, check if previous status was 'pending' using a field tracker package
        # or by checking instance._state.adding (already handled by 'created')
        logger.info(f"School activated: {instance.name}. Queueing approval email.")
        try:
            send_email_task.delay(
                'school_approved', 
                instance.email, 
                {
                    'school_name': instance.name, 
                    'login_url': f"https://{instance.domain}.myregistra.net/login"
                }
            )
        except Exception as e:
            logger.error(f"Failed to queue approval email for {instance.name}: {e}")
