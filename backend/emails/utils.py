import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template import Template, Context
from django.utils.html import strip_tags
from .models import EmailTemplate, EmailLog

logger = logging.getLogger(__name__)

def send_template_email(template_name, recipient_email, context=None):
    """
    Sends an email using a database-stored template.
    
    Args:
        template_name (str): The 'slug' or 'name' of the EmailTemplate.
        recipient_email (str): The recipient's email address.
        context (dict): Dictionary of variables to render in the template.
    """
    if context is None:
        context = {}

    # 1. Fetch Template
    try:
        email_template = EmailTemplate.objects.get(slug=template_name)
    except EmailTemplate.DoesNotExist:
        logger.error(f"EmailTemplate '{template_name}' not found.")
        return False

    # 2. Render Subject
    subject_template = Template(email_template.subject)
    subject = subject_template.render(Context(context))

    # 3. Render Body (HTML)
    html_template = Template(email_template.body_html)
    html_content = html_template.render(Context(context))

    # 4. Generate Plain Text (Fallback)
    if email_template.body_text:
        text_template = Template(email_template.body_text)
        text_content = text_template.render(Context(context))
    else:
        text_content = strip_tags(html_content)

    # 5. Get Dynamic SMTP Settings
    from schools.models import PlatformSettings
    from django.core.mail import get_connection
    
    p_settings = PlatformSettings.objects.first()
    
    # Use dynamic settings if available, otherwise fallback to defaults in settings.py
    email_host = getattr(p_settings, 'email_host', None) or settings.EMAIL_HOST
    email_port = getattr(p_settings, 'email_port', None) or settings.EMAIL_PORT
    email_user = getattr(p_settings, 'email_user', None) or settings.EMAIL_HOST_USER
    email_password = getattr(p_settings, 'email_password', None) or settings.EMAIL_HOST_PASSWORD
    email_from = getattr(p_settings, 'email_from', None) or settings.DEFAULT_FROM_EMAIL
    use_tls = getattr(p_settings, 'email_use_tls', True)
    use_ssl = getattr(p_settings, 'email_use_ssl', False)

    connection = get_connection(
        host=email_host,
        port=email_port,
        username=email_user,
        password=email_password,
        use_tls=use_tls,
        use_ssl=use_ssl,
        timeout=10
    )

    # 6. Create Email Message
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=email_from,
        to=[recipient_email],
        connection=connection
    )
    email.attach_alternative(html_content, "text/html")

    # 6. Send & Log
    status = 'sent'
    error_message = ''
    try:
        email.send()
    except Exception as e:
        status = 'failed'
        error_message = str(e)
        logger.error(f"Failed to send email '{template_name}' to {recipient_email}: {e}")

    # 7. Create Log Entry
    try:
        EmailLog.objects.create(
            recipient=recipient_email,
            template=email_template,
            status=status,
            error_message=error_message,
            metadata=context
        )
    except Exception as log_error:
        logger.error(f"Failed to create EmailLog: {log_error}")

    return status == 'sent'
