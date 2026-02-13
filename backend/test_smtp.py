import os
import django
import sys
import traceback

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings
from schools.models import PlatformSettings

def test_send():
    print("🚀 Starting Email Delivery Diagnostic...")
    
    # 1. Check Platform Settings
    print("\n[1/3] Reading Platform Settings...")
    p_settings = PlatformSettings.objects.first()
    
    provider = 'smtp'
    host = settings.EMAIL_HOST
    port = settings.EMAIL_PORT
    user = settings.EMAIL_HOST_USER
    password = settings.EMAIL_HOST_PASSWORD
    use_tls = settings.EMAIL_USE_TLS
    from_email = settings.DEFAULT_FROM_EMAIL
    
    if p_settings:
        print(f"✅ Found PlatformSettings (ID: {p_settings.id})")
        provider = p_settings.email_provider
        if provider == 'smtp':
            host = p_settings.email_host or host
            port = p_settings.email_port or port
            user = p_settings.email_user or user
            password = p_settings.email_password or password
            use_tls = p_settings.email_use_tls
            from_email = p_settings.email_from or from_email
            print(f"   - Provider: Standard SMTP")
            print(f"   - Host: {host}")
            print(f"   - Port: {port}")
            print(f"   - User: {user}")
            print(f"   - From: {from_email}")
            print(f"   - TLS: {use_tls}")
        else:
            print(f"   - Provider: Brevo API")
            print(f"   - API Key: {'Set' if p_settings.email_api_key else 'Missing'}")
            print(f"   - From: {p_settings.email_from or from_email}")
    else:
        print("⚠️ No PlatformSettings found. Using defaults from settings.py.")

    # 2. Preparation
    print("\n[2/3] Preparing Email...")
    subject = "Diagnostic Test Email"
    body = "This is a test email from the Registra diagnostic script."
    recipient = from_email # Send to self for test
    
    if not recipient:
        print("❌ Error: No sender/recipient email identified. Please check your settings.")
        return

    # 3. Sending
    print(f"\n[3/3] Attempting to Send to '{recipient}'...")
    try:
        if provider == 'brevo_api':
            import requests
            api_key = p_settings.email_api_key
            if not api_key:
                raise Exception("Brevo API Key is missing.")
            
            payload = {
                "sender": {"email": from_email, "name": "Registra Diagnostic"},
                "to": [{"email": recipient}],
                "subject": subject,
                "textContent": body
            }
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": api_key
            }
            response = requests.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers)
            if response.status_code in [201, 202, 200]:
                print("✅ SUCCESS! Brevo API accepted the email.")
                print(f"   Response: {response.json()}")
            else:
                print(f"❌ FAILED! Brevo API returned status code {response.status_code}")
                print(f"   Reason: {response.text}")
        else:
            connection = get_connection(
                host=host,
                port=port,
                username=user,
                password=password,
                use_tls=use_tls
            )
            email = EmailMultiAlternatives(subject, body, from_email, [recipient], connection=connection)
            email.send()
            print("✅ SUCCESS! SMTP server accepted the email.")
            
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {str(e)}")
        print("\n--- Traceback ---")
        traceback.print_exc()

if __name__ == '__main__':
    test_send()
