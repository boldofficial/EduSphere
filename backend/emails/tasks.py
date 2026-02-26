from celery import shared_task
from django.utils import timezone
from .utils import send_template_email, send_custom_email
from .models import EmailCampaign
from django.contrib.auth import get_user_model
import logging
import time

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task
def send_email_task(template_name, recipient_email, context=None, campaign_id=None):
    """
    Async wrapper for sending template emails.
    """
    campaign = EmailCampaign.objects.get(id=campaign_id) if campaign_id else None
    logger.info(f"Sending email '{template_name}' to {recipient_email}")
    return send_template_email(template_name, recipient_email, context, campaign=campaign)

@shared_task
def send_custom_email_task(recipient_email, subject, body_html, campaign_id=None):
    """
    Async wrapper for sending custom HTML emails.
    """
    campaign = EmailCampaign.objects.get(id=campaign_id) if campaign_id else None
    logger.info(f"Sending custom email to {recipient_email}")
    return send_custom_email(recipient_email, subject, body_html, campaign=campaign)

@shared_task
def process_campaign_task(campaign_id):
    """
    Processes a bulk email campaign.
    """
    try:
        campaign = EmailCampaign.objects.get(id=campaign_id)
    except EmailCampaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found")
        return

    campaign.status = 'sending'
    campaign.started_at = timezone.now()
    campaign.save()

    # 1. Filter Audience
    filters = campaign.audience_filter or {}
    users = User.objects.filter(is_active=True)
    
    if filters.get('role'):
        users = users.filter(role=filters['role'])
    if filters.get('school_id'):
        users = users.filter(school_id=filters['school_id'])
    
    recipients = list(users.values_list('email', flat=True))
    campaign.total_recipients = len(recipients)
    campaign.save()

    sent = 0
    failed = 0

    for email in recipients:
        try:
            if campaign.template:
                # Use Template
                success = send_template_email(
                    campaign.template.slug, 
                    email, 
                    context={'campaign_title': campaign.title},
                    campaign=campaign
                )
            else:
                # Use Custom Body
                success = send_custom_email(
                    email, 
                    campaign.custom_subject or campaign.title,
                    campaign.custom_body,
                    campaign=campaign
                )
            
            if success:
                sent += 1
            else:
                failed += 1
        except Exception as e:
            logger.error(f"Failed to process campaign email for {email}: {e}")
            failed += 1
        
        # Periodic update
        if (sent + failed) % 10 == 0:
            campaign.sent_count = sent
            campaign.failed_count = failed
            campaign.save()
        
        # Simple rate limiting (100ms between sends to avoid provider bursts)
        time.sleep(0.1)

    campaign.sent_count = sent
    campaign.failed_count = failed
    campaign.status = 'completed' if failed == 0 else 'failed'
    campaign.completed_at = timezone.now()
    campaign.save()
    
    logger.info(f"Campaign {campaign.title} finished: {sent} sent, {failed} failed")
