import logging
from celery import shared_task
from django.utils import timezone
from .models import Subscription

logger = logging.getLogger(__name__)

@shared_task
def check_subscription_expiry():
    """
    Automated task to check for expired subscriptions and update their status.
    Runs daily via Celery Beat.
    """
    now_date = timezone.now().date()
    
    # Find all active or pending subscriptions that have passed their end_date
    expired_subs = Subscription.objects.filter(
        end_date__lt=now_date,
    ).exclude(status='expired')
    
    count = 0
    for sub in expired_subs:
        sub.status = 'expired'
        sub.save(update_fields=['status'])
        
        # Notify the school admin
        # Assuming we have a school email or an admin user we can notify
        try:
            from emails.tasks import send_custom_email_task
            school_email = sub.school.email or sub.school.contact_email
            if school_email:
                send_custom_email_task.delay(
                    subject="Your Registra Subscription Has Expired",
                    message=f"Hello, your subscription for {sub.school.name} has expired. Please renew your plan to restore access.",
                    recipient_list=[school_email]
                )
        except Exception as e:
            logger.error(f"Failed to send expiration email for {sub.school.name}: {e}")
            
        logger.info(f"Subscription {sub.id} for school {sub.school.name} marked as expired.")
        count += 1
        
    logger.info(f"Processed {count} expired subscriptions.")
    return count


@shared_task
def auto_report_generation():
    """
    Automated task to generate end-of-term reports.
    Scheduled to run based on term calendar.
    """
    # TODO: Implement full report generation logic here
    logger.info("Auto report generation task triggered.")
    return True
