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
        error_msg = f"EmailTemplate '{template_name}' not found."
        logger.error(error_msg)
        # Create log entry even without template
        try:
            EmailLog.objects.create(
                recipient=recipient_email,
                status='failed',
                error_message=error_msg,
                metadata=context
            )
        except Exception as log_error:
            logger.error(f"Failed to create EmailLog for missing template: {log_error}")
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

    # 5. Get Dynamic SMTP/API Settings
    from schools.models import PlatformSettings
    import requests
    from django.core.mail import get_connection
    
    p_settings = PlatformSettings.objects.first()
    
    provider = 'smtp'
    email_from = settings.DEFAULT_FROM_EMAIL
    email_from_name = 'Registra'
    api_key = None

    if p_settings:
        provider = p_settings.email_provider
        email_from = p_settings.email_from or settings.DEFAULT_FROM_EMAIL
        email_from_name = p_settings.email_from_name or 'Registra'
        api_key = p_settings.email_api_key.strip() if p_settings.email_api_key else None

    status = 'sent'
    error_message = ''

    if provider == 'brevo_api' and api_key:
        # Use Brevo API
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": p_settings.email_api_key
        }
        payload = {
            "sender": {"name": email_from_name, "email": email_from},
            "to": [{"email": recipient_email}],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code not in [200, 201, 202]:
                status = 'failed'
                error_message = response.text
                logger.error(f"Brevo API error: {response.text}")
        except Exception as e:
            status = 'failed'
            error_message = str(e)
            logger.error(f"Failed to send Brevo API email: {e}")
    else:
        # Use Dynamic SMTP (fallback to settings.py)
        email_host = getattr(p_settings, 'email_host', None) if p_settings else None
        email_host = email_host or settings.EMAIL_HOST
        
        email_port = getattr(p_settings, 'email_port', None) if p_settings else None
        email_port = email_port or settings.EMAIL_PORT
        
        email_user = getattr(p_settings, 'email_user', None) if p_settings else None
        email_user = email_user or settings.EMAIL_HOST_USER
        
        email_password = getattr(p_settings, 'email_password', None) if p_settings else None
        email_password = email_password or settings.EMAIL_HOST_PASSWORD
        
        use_tls = getattr(p_settings, 'email_use_tls', True) if p_settings else True
        use_ssl = getattr(p_settings, 'email_use_ssl', False) if p_settings else False

        try:
            connection = get_connection(
                host=email_host,
                port=email_port,
                username=email_user,
                password=email_password,
                use_tls=use_tls,
                use_ssl=use_ssl,
                timeout=10
            )

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=f"{email_from_name} <{email_from}>",
                to=[recipient_email],
                connection=connection
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
        except Exception as e:
            status = 'failed'
            error_message = str(e)
            logger.error(f"Failed to send SMTP email '{template_name}' to {recipient_email}: {e}")

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
