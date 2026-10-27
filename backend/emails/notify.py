"""
Who to email and how to queue it. Every platform notification goes through `queue_template_email`:
it waits for the database transaction to commit (no email about a registration that was rolled back),
sends through Celery, and falls back to sending directly if the queue is unavailable.
"""

import logging

from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)


def _dedupe(emails):
    seen, result = set(), []
    for email in emails:
        email = (email or "").strip()
        if email and email.lower() not in seen:
            seen.add(email.lower())
            result.append(email)
    return result


def school_recipients(school):
    """The school's contact address plus its admins' addresses, without duplicates."""
    admins = school.users.filter(role="SCHOOL_ADMIN", is_active=True).exclude(email="").values_list("email", flat=True)
    return _dedupe([school.email, *admins])


def super_admin_recipients():
    from users.models import User

    emails = User.objects.filter(role="SUPER_ADMIN", is_active=True).exclude(email="").values_list("email", flat=True)
    return _dedupe([*emails, getattr(settings, "SUPPORT_EMAIL", "")])


def school_portal_url(school):
    """The school's own web address: its custom domain if set, else its subdomain."""
    if getattr(school, "custom_domain", None) and school.custom_domain_allowed:
        return f"https://{school.custom_domain}"
    root = getattr(settings, "ROOT_DOMAIN", "myregistra.net")
    return f"https://{school.domain}.{root}"


def school_login_url(school):
    return f"{school_portal_url(school)}/login"


def queue_template_email(slug, recipients, context=None, reply_to=None):
    """Send a template email to each recipient once the current transaction commits."""
    recipients = _dedupe(recipients if isinstance(recipients, (list, tuple)) else [recipients])
    if not recipients:
        logger.warning("Email '%s' skipped: no recipient address.", slug)
        return

    def send():
        from .tasks import send_email_task
        from .utils import send_template_email

        for recipient in recipients:
            try:
                send_email_task.delay(slug, recipient, context or {}, reply_to=reply_to)
            except Exception as exc:  # queue down: deliver now rather than lose the email
                logger.warning("Email queue unavailable (%s); sending '%s' directly.", exc, slug)
                send_template_email(slug, recipient, context or {}, reply_to=reply_to)

    transaction.on_commit(send)
