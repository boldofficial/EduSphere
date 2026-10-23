import logging
import time

from celery import shared_task

from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import EmailCampaign
from .utils import send_custom_email, send_template_email

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def send_email_task(template_name, recipient_email, context=None, campaign_id=None, reply_to=None):
    """Send one template email (see emails.notify.queue_template_email)."""
    campaign = EmailCampaign.objects.filter(id=campaign_id).first() if campaign_id else None
    logger.info(f"Sending email '{template_name}' to {recipient_email}")
    return send_template_email(template_name, recipient_email, context, campaign=campaign, reply_to=reply_to)


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

    campaign.status = "sending"
    campaign.started_at = timezone.now()
    campaign.save()

    # 1. Filter Audience
    filters = campaign.audience_filter or {}
    users = User.objects.filter(is_active=True).exclude(email="").exclude(email__isnull=True)

    if filters.get("role"):
        users = users.filter(role=filters["role"])
    if filters.get("school_id"):
        users = users.filter(school_id=filters["school_id"])

    # One email per address, even when several accounts share it.
    seen, recipients = set(), []
    for address in users.values_list("email", flat=True):
        if address.strip().lower() not in seen:
            seen.add(address.strip().lower())
            recipients.append(address.strip())
    campaign.total_recipients = len(recipients)
    campaign.save()

    sent = 0
    failed = 0

    for email in recipients:
        try:
            if campaign.template:
                # Use Template
                success = send_template_email(
                    campaign.template.slug, email, context={"campaign_title": campaign.title}, campaign=campaign
                )
            else:
                # Use Custom Body
                success = send_custom_email(
                    email, campaign.custom_subject or campaign.title, campaign.custom_body, campaign=campaign
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
    campaign.status = "completed" if failed == 0 else "failed"
    campaign.completed_at = timezone.now()
    campaign.save()

    logger.info(f"Campaign {campaign.title} finished: {sent} sent, {failed} failed")


@shared_task
def send_announcement_task(announcement_id):
    """Email a platform announcement to every active user with the announcement's target role."""
    from core.models import PlatformAnnouncement

    announcement = PlatformAnnouncement.objects.filter(id=announcement_id).first()
    if not announcement:
        return 0
    users = (
        User.objects.filter(is_active=True, role=announcement.target_role)
        .exclude(email="")
        .exclude(email__isnull=True)
        .only("email", "first_name", "last_name")
    )
    seen, sent = set(), 0
    for user in users.iterator():
        address = user.email.strip()
        if address.lower() in seen:
            continue
        seen.add(address.lower())
        context = {"title": announcement.title, "message": announcement.message, "name": user.get_full_name()}
        if send_template_email("platform_announcement", address, context):
            sent += 1
        time.sleep(0.1)  # stay under provider rate limits
    logger.info("Announcement %s emailed to %s of %s users", announcement_id, sent, len(seen))
    return sent
