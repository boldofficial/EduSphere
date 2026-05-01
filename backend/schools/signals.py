import logging

from django.db import models
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from emails.tasks import send_email_task

from .models import School

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=School)
def capture_previous_status(sender, instance, **kwargs):
    """
    Capture the previous subscription status before saving.
    """
    if instance.pk:
        try:
            old_instance = School.objects.get(pk=instance.pk)
            instance._previous_sub_status = (
                old_instance.subscription.status
                if hasattr(old_instance, "subscription") and old_instance.subscription
                else "none"
            )
        except School.DoesNotExist:
            instance._previous_sub_status = "none"
    else:
        instance._previous_sub_status = "none"


@receiver(post_save, sender=School)
def send_school_status_email(sender, instance, created, **kwargs):
    """
    Sends automated emails based on School status changes.
    """
    # 1. New School Signup -> Welcome Email
    if created:
        logger.info(f"New school created: {instance.name}. Queueing welcome email.")
        if not instance.email:
            logger.warning(
                "Skipping welcome email for %s because school email is empty.",
                instance.name,
            )
            return
        try:
            send_email_task.delay(
                "welcome_email", instance.email, {"school_name": instance.name, "domain": instance.domain}
            )
        except Exception as e:
            logger.error(f"Failed to queue welcome email for {instance.name}: {e}")

    # 2. Status Change to Active -> Approval Email
    sub_status = "none"
    if hasattr(instance, "subscription") and instance.subscription:
        sub_status = instance.subscription.status

    previous_sub_status = getattr(instance, "_previous_sub_status", "none")

    # Only send if status transitioned from something else to 'active'
    if not created and sub_status == "active" and previous_sub_status != "active":
        if not instance.email:
            logger.warning(
                "Skipping approval email for %s because school email is empty.",
                instance.name,
            )
            return

        logger.info(f"School activated: {instance.name}. Queueing approval email.")
        try:
            send_email_task.delay(
                "school_approved",
                instance.email,
                {"school_name": instance.name, "login_url": f"https://{instance.domain}.myregistra.net/login"},
            )
        except Exception as e:
            logger.error(f"Failed to queue approval email for {instance.name}: {e}")

