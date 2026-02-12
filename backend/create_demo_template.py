import os
import django
import sys

# Add the project root to the path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from emails.models import EmailTemplate

def create_template():
    slug = 'demo-approved'
    defaults = {
        'name': 'Demo Request Approved',
        'subject': 'Your Demo Request for {{ school_name }} is Approved!',
        'body_html': """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; }
        .credentials { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .credential-item { margin-bottom: 10px; }
        .label { font-weight: bold; color: #4b5563; min-width: 100px; display: inline-block; }
        .value { font-family: 'Courier New', monospace; color: #111827; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; }
        .button { display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size: 24px;">Welcome to Registra</h1>
        </div>
        <div class="content">
            <p>Hi {{ name }},</p>
            <p>Great news! Your request for access to the <strong>{{ school_name }}</strong> demo has been approved.</p>
            <p>You can now log in and explore the full capabilities of our school management system.</p>
            
            <div class="credentials">
                <div class="credential-item">
                    <span class="label">Login URL:</span>
                    <a href="{{ login_url }}" style="color: #6366f1;">{{ login_url }}</a>
                </div>
                <div class="credential-item">
                    <span class="label">Username:</span>
                    <span class="value">{{ username }}</span>
                </div>
                <div class="credential-item">
                    <span class="label">Password:</span>
                    <span class="value">{{ password }}</span>
                </div>
            </div>

            <center>
                <a href="{{ login_url }}" class="button">Log In to Dashboard</a>
            </center>

            <p>If you have any questions during your trial, feel free to reply to this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Registra School Manager. All rights reserved.</p>
        </div>
    </div>
</body>
</html>""",
        'body_text': """Welcome to Registra, {{ name }}!

Great news! Your request for access to the {{ school_name }} demo has been approved.

Here are your login credentials:

Login URL: {{ login_url }}
Username: {{ username }}
Password: {{ password }}

Please log in and explore the platform.

Best regards,
The Registra Team""",
        'variables': {
            'name': 'Applicant Name',
            'school_name': 'School Name',
            'login_url': 'Link to Login',
            'username': 'Demo Username',
            'password': 'Demo Password'
        },
        'is_active': True
    }

    t, created = EmailTemplate.objects.get_or_create(slug=slug, defaults=defaults)
    
    if created:
        print(f"✅ Successfully created template: '{slug}'")
    else:
        # Update existing to ensure it works
        for key, value in defaults.items():
            setattr(t, key, value)
        t.save()
        print(f"🔄 Updated existing template: '{slug}'")

if __name__ == '__main__':
    create_template()
