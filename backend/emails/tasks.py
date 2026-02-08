from celery import shared_task
from .utils import send_template_email
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(template_name, recipient_email, context=None):
    """
    Async wrapper for sending template emails.
    """
    logger.info(f"Queueing email '{template_name}' to {recipient_email}")
    return send_template_email(template_name, recipient_email, context)
