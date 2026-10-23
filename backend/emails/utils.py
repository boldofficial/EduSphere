"""
Sending email: one place that decides how mail leaves the platform and records every attempt.

Provider settings come from Super Admin > Platform settings (Brevo API or SMTP), falling back to the
SMTP_* environment variables. If neither is complete, nothing is pretended: the attempt is logged as
failed with the reason (in DEBUG, mail is printed to the console instead).
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template import Context, Template
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .defaults import DEFAULT_TEMPLATES
from .models import EmailLog, EmailTemplate

logger = logging.getLogger(__name__)

SMTP_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
CONSOLE_BACKEND = "django.core.mail.backends.console.EmailBackend"
NOT_CONFIGURED = (
    "Email is not configured. Set the email provider in Super Admin > Platform settings "
    "(Brevo API key, or SMTP host, user and password)."
)


def wrap_professional_email(html_content, platform_name="Registra"):
    """Wraps HTML content in the shared base_email.html layout."""
    frontend = getattr(settings, "FRONTEND_URL", "") or "#"
    context = {
        "content": html_content,
        "platform_name": platform_name,
        "year": timezone.now().year,
        "platform_url": frontend,
        "support_url": f"{frontend}/support" if frontend != "#" else "#",
    }
    return render_to_string("emails/base_email.html", context)


def email_config():
    """
    The effective email settings: provider, sender and credentials, plus whether they are complete.
    Platform settings win; the SMTP_* environment variables fill any gaps.
    """
    from schools.models import PlatformSettings

    p = PlatformSettings.objects.first()

    def pick(attr, fallback):
        value = getattr(p, attr, None) if p else None
        if isinstance(value, str):
            value = value.strip()
        return value or fallback

    config = {
        "provider": pick("email_provider", "smtp"),
        "from_email": pick("email_from", settings.DEFAULT_FROM_EMAIL),
        "from_name": pick("email_from_name", "Registra"),
        "api_key": pick("email_api_key", None),
        "host": pick("email_host", settings.EMAIL_HOST),
        "port": int(pick("email_port", settings.EMAIL_PORT) or 587),
        "user": pick("email_user", settings.EMAIL_HOST_USER),
        "password": pick("email_password", settings.EMAIL_HOST_PASSWORD),
        "use_tls": bool(getattr(p, "email_use_tls", True)) if p else True,
        "use_ssl": bool(getattr(p, "email_use_ssl", False)) if p else False,
    }
    if config["provider"] == "brevo_api":
        config["configured"] = bool(config["api_key"])
    else:
        config["configured"] = bool(config["host"] and config["user"] and config["password"])
    # Port 465 is implicit TLS; TLS and SSL together is never valid.
    if config["port"] == 465:
        config["use_ssl"], config["use_tls"] = True, False
    elif config["use_ssl"] and config["use_tls"]:
        config["use_ssl"] = False
    return config


def _render(template_string, context):
    return Template(template_string).render(Context(context or {}))


def get_template(slug):
    """A saved template (Super Admin → Templates) or the built-in default, as (subject, body, db_template)."""
    db_template = EmailTemplate.objects.filter(slug=slug).first()
    if db_template:
        return db_template.subject, db_template.body_html, db_template
    default = DEFAULT_TEMPLATES.get(slug)
    if default:
        return default["subject"], default["body_html"], None
    return None, None, None


def send_template_email(template_name, recipient_email, context=None, campaign=None, use_wrapper=True, reply_to=None):
    """Send an email from a template slug. Returns True when the provider accepted it."""
    context = context or {}
    subject_tpl, body_tpl, db_template = get_template(template_name)
    if subject_tpl is None:
        error = f"Email template '{template_name}' not found."
        logger.error(error)
        EmailLog.objects.create(
            recipient=recipient_email, status="failed", error_message=error, metadata=context, campaign=campaign
        )
        return False

    subject = " ".join(_render(subject_tpl, context).split())
    html_content = _render(body_tpl, context)
    if use_wrapper:
        html_content = wrap_professional_email(html_content)
    return _send_raw_email(
        recipient_email,
        subject,
        html_content,
        strip_tags(html_content),
        template=db_template,
        campaign=campaign,
        context={**context, "_template": template_name},
        reply_to=reply_to,
    )


def send_custom_email(recipient_email, subject, body_html, campaign=None, use_wrapper=True, reply_to=None):
    """Send a one-off HTML email, wrapped in the shared layout."""
    if use_wrapper:
        body_html = wrap_professional_email(body_html)
    return _send_raw_email(
        recipient_email, subject, body_html, strip_tags(body_html), campaign=campaign, reply_to=reply_to
    )


def _send_raw_email(
    recipient_email, subject, html_content, text_content, template=None, campaign=None, context=None, reply_to=None
):
    """Deliver through the configured provider and log the outcome."""
    import requests

    config = email_config()
    status, error_message = "sent", ""
    reply_to = [reply_to] if isinstance(reply_to, str) and reply_to else (reply_to or [])

    if not recipient_email:
        status, error_message = "failed", "No recipient address."
    elif not config["configured"] and not settings.DEBUG:
        status, error_message = "failed", NOT_CONFIGURED
        logger.error("Email to %s not sent: %s", recipient_email, NOT_CONFIGURED)
    elif config["provider"] == "brevo_api" and config["configured"]:
        payload = {
            "sender": {"name": config["from_name"], "email": config["from_email"]},
            "to": [{"email": recipient_email}],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content,
        }
        if reply_to:
            payload["replyTo"] = {"email": reply_to[0]}
        try:
            response = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                json=payload,
                headers={"accept": "application/json", "api-key": config["api_key"]},
                timeout=15,
            )
            if response.status_code not in (200, 201, 202):
                status, error_message = "failed", f"Brevo API {response.status_code}: {response.text[:500]}"
        except Exception as exc:
            status, error_message = "failed", f"{type(exc).__name__}: {exc}"
    else:
        # settings.EMAIL_BACKEND becomes the console backend when SMTP_* env vars are missing, which used to
        # swallow mail even when SMTP was set up in Platform settings. Real SMTP whenever it is configured;
        # any other backend (e.g. tests' in-memory outbox) is respected.
        backend = settings.EMAIL_BACKEND
        if backend == CONSOLE_BACKEND and config["configured"]:
            backend = SMTP_BACKEND
        try:
            connection = get_connection(
                backend,
                host=config["host"],
                port=config["port"],
                username=config["user"],
                password=config["password"],
                use_tls=config["use_tls"],
                use_ssl=config["use_ssl"],
                timeout=15,
            )
            message = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=f"{config['from_name']} <{config['from_email']}>",
                to=[recipient_email],
                reply_to=reply_to,
                connection=connection,
            )
            message.attach_alternative(html_content, "text/html")
            message.send()
        except Exception as exc:
            status, error_message = "failed", f"{type(exc).__name__}: {exc}"

    if status == "failed":
        logger.error("Email to %s failed: %s", recipient_email, error_message)
    try:
        EmailLog.objects.create(
            recipient=recipient_email or "",
            template=template,
            campaign=campaign,
            subject=subject[:255],
            status=status,
            error_message=error_message,
            metadata=context or {},
        )
    except Exception as log_error:
        logger.error(f"Failed to create EmailLog: {log_error}")
    return status == "sent"
