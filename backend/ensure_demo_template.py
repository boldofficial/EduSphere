import os
import django
import sys

# Add the project root to the path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from emails.models import EmailTemplate
from schools.models import PlatformSettings

def run_fix():
    print("🚀 Updating Registra Approval Template (Multi-Portal)...")

    # 1. Ensure PlatformSettings exists
    p_settings, _ = PlatformSettings.objects.get_or_create(id=1)

    # 2. Update EmailTemplate for demo-approved
    slug = 'demo-approved'
    defaults = {
        'name': 'Demo Request Approved (Multi-Portal)',
        'subject': 'Your Access to {{ school_name }} is Approved!',
        'body_html': """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 650px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { padding: 30px; }
        .welcome-msg { font-size: 18px; color: #111827; margin-bottom: 20px; }
        
        .portal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .portal-card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 15px; }
        .portal-name { font-weight: bold; color: #4f46e5; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 10px; display: block; }
        .cred-item { font-size: 14px; margin-bottom: 5px; }
        .label { color: #6b7280; font-weight: 500; }
        .value { font-family: 'Courier New', monospace; color: #111827; font-weight: bold; background: #f3f4f6; padding: 2px 4px; border-radius: 3px; }
        
        .login-btn { display: block; width: 200px; margin: 30px auto; background-color: #6366f1; color: white; padding: 14px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size: 28px;">Welcome to Registra</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Digital Campus Access Granted</p>
        </div>
        <div class="content">
            <p class="welcome-msg">Hi {{ name }},</p>
            <p>Your request for access to the <strong>{{ school_name }}</strong> demo has been approved. You can now explore the platform across different user roles.</p>
            
            <p style="font-weight: 600; color: #374151; margin-top: 30px; margin-bottom: 10px;">Select a portal to explore:</p>
            
            <div class="portal-grid">
                <!-- Admin -->
                <div class="portal-card">
                    <span class="portal-name">🔐 Admin Portal</span>
                    <div class="cred-item"><span class="label">Email:</span> <span class="value">demo@myregistra.net</span></div>
                    <div class="cred-item"><span class="label">Pass:</span> <span class="value">{{ password }}</span></div>
                </div>
                
                <!-- Teacher -->
                <div class="portal-card">
                    <span class="portal-name">👨‍🏫 Teacher Portal</span>
                    <div class="cred-item"><span class="label">Email:</span> <span class="value">teacher@myregistra.net</span></div>
                    <div class="cred-item"><span class="label">Pass:</span> <span class="value">{{ password }}</span></div>
                </div>
                
                <!-- Student -->
                <div class="portal-card">
                    <span class="portal-name">🎓 Student / Parent</span>
                    <div class="cred-item"><span class="label">Student No:</span> <span class="value">ST001</span></div>
                    <div class="cred-item"><span class="label">Pass:</span> <span class="value">{{ password }}</span></div>
                </div>
                
                <!-- Staff -->
                <div class="portal-card">
                    <span class="portal-name">💼 Non-Teaching</span>
                    <div class="cred-item"><span class="label">Email:</span> <span class="value">staff@myregistra.net</span></div>
                    <div class="cred-item"><span class="label">Pass:</span> <span class="value">{{ password }}</span></div>
                </div>
            </div>

            <a href="{{ login_url }}" class="login-btn">Log In to Demo</a>

            <p style="font-size: 14px; color: #6b7280; text-align: center;">Use the credentials above to explore each dedicated dashboard.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Registra School Manager. All rights reserved.</p>
        </div>
    </div>
</body>
</html>""",
        'body_text': """Welcome to Registra, {{ name }}!
 
Your request for access to {{ school_name }} has been approved.
 
Here are the login credentials for all portals:
 
- Admin Portal: demo@myregistra.net
- Teacher Portal: teacher@myregistra.net
- Student/Parent Portal: ST001
- Non-Teaching Portal: staff@myregistra.net
 
Shared Password: {{ password }}
 
Login URL: {{ login_url }}
 
Best regards,
The Registra Team""",
        'variables': {
            'name': 'Applicant Name',
            'school_name': 'School Name',
            'login_url': 'Link to Login',
            'password': 'Demo Password'
        },
        'is_active': True
    }

    t, created = EmailTemplate.objects.update_or_create(slug=slug, defaults=defaults)
    if created:
        print(f"✅ Created template: '{slug}'")
    else:
        print(f"✅ Updated template: '{slug}'")

    print("\n✨ Email template is now ready for all demo roles.")

if __name__ == '__main__':
    run_fix()
