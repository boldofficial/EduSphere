from django.core.management.base import BaseCommand
from emails.models import EmailTemplate

class Command(BaseCommand):
    help = 'Seeds comprehensive email templates for all use cases'

    def handle(self, *args, **options):
        # Base email template styling
        base_style = """
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Registra</h1>
            </div>
            <div style="padding: 40px 30px; color: #333333;">
                {content}
            </div>
            <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #6c757d;">
                <p style="margin: 0 0 10px 0;">&copy; 2024 Registra - School Management Platform</p>
                <p style="margin: 0;"><a href="https://myregistra.net" style="color: #667eea; text-decoration: none;">Visit our website</a></p>
            </div>
        </div>
        """

        button_style = "display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;"

        templates = [
            # 1. Welcome Email
            {
                'name': 'Welcome Email',
                'slug': 'welcome_email',
                'subject': '🎉 Welcome to Registra, {{ school_name }}!',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">Welcome to Registra!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hi <strong>{{{{ school_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Thank you for choosing Registra as your school management platform! We're excited to have you on board.</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Your account is currently under review and will be activated shortly. Once approved, you'll receive a confirmation email with login details.</p>
                    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #667eea;">Your School Domain:</p>
                        <p style="margin: 0; font-size: 18px; color: #1a202c;"><strong>https://{{{{ domain }}}}.myregistra.net</strong></p>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; color: #6c757d;">If you have any questions, feel free to reach out to our support team.</p>
                """),
                'variables': {'school_name': 'Example School', 'domain': 'example'}
            },

            # 2. School Approved
            {
                'name': 'School Approved',
                'slug': 'school_approved',
                'subject': '✅ Your School "{{ school_name }}" is Now Active!',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">🎉 Great News!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hello <strong>{{{{ school_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Your school registration has been <strong style="color: #10b981;">approved</strong> and your account is now active!</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">You can now access your dashboard and start managing your school.</p>
                    <center>
                        <a href="{{{{ login_url }}}}" style="{button_style}">Access Your Dashboard →</a>
                    </center>
                    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                        <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Next Steps:</strong></p>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #065f46;">
                            <li>Complete your school profile</li>
                            <li>Add teachers and staff</li>
                            <li>Set up your academic terms</li>
                            <li>Start enrolling students</li>
                        </ul>
                    </div>
                """),
                'variables': {'school_name': 'Example School', 'login_url': 'https://example.myregistra.net/login'}
            },

            # 3. School Suspended
            {
                'name': 'School Suspended',
                'slug': 'school_suspended',
                'subject': '⚠️ Account Suspended - {{ school_name }}',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #dc2626; margin: 0 0 20px 0;">Account Suspended</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Dear <strong>{{{{ school_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">We're writing to inform you that your school account has been temporarily suspended.</p>
                    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Reason:</p>
                        <p style="margin: 0; color: #7f1d1d;">{{{{ reason }}}}</p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">To resolve this issue and restore your account, please contact our support team:</p>
                    <center>
                        <a href="mailto:{{{{ support_email }}}}" style="{button_style}">Contact Support</a>
                    </center>
                """),
                'variables': {'school_name': 'Example School', 'reason': 'Payment overdue', 'support_email': 'support@myregistra.net'}
            },

            # 4. Subscription Expiring
            {
                'name': 'Subscription Expiring',
                'slug': 'subscription_expiring',
                'subject': '⏰ Your Subscription Expires in 7 Days',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #f59e0b; margin: 0 0 20px 0;">Subscription Expiring Soon</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hi <strong>{{{{ school_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Your subscription will expire on <strong>{{{{ expiry_date }}}}</strong>.</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">To ensure uninterrupted access to your school management platform, please renew your subscription before the expiry date.</p>
                    <center>
                        <a href="{{{{ renewal_url }}}}" style="{button_style}">Renew Subscription →</a>
                    </center>
                    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">After expiry, you'll lose access to all features until renewal.</p>
                    </div>
                """),
                'variables': {'school_name': 'Example School', 'expiry_date': '2024-03-01', 'renewal_url': 'https://myregistra.net/renew'}
            },

            # 5. Subscription Expired
            {
                'name': 'Subscription Expired',
                'slug': 'subscription_expired',
                'subject': '🔴 Your Subscription Has Expired',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #dc2626; margin: 0 0 20px 0;">Subscription Expired</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Dear <strong>{{{{ school_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Your subscription has expired. Your account is now in <strong>read-only mode</strong>.</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">To restore full access and continue managing your school, please renew your subscription now.</p>
                    <center>
                        <a href="{{{{ renewal_url }}}}" style="{button_style}">Renew Now →</a>
                    </center>
                    <p style="font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; color: #6c757d;">Have questions? Contact our support team for assistance.</p>
                """),
                'variables': {'school_name': 'Example School', 'renewal_url': 'https://myregistra.net/renew'}
            },

            # 6. Password Reset
            {
                'name': 'Password Reset',
                'slug': 'password_reset',
                'subject': '🔒 Password Reset Request',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">Reset Your Password</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hi <strong>{{{{ user_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">We received a request to reset your password. Click the button below to set a new password:</p>
                    <center>
                        <a href="{{{{ reset_url }}}}" style="{button_style}">Reset Password →</a>
                    </center>
                    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Security Notice:</strong> This link expires in 24 hours. If you didn't request this, please ignore this email.</p>
                    </div>
                """),
                'variables': {'user_name': 'John Doe', 'reset_url': 'https://myregistra.net/reset-password/token'}
            },

            # 7. Account Created
            {
                'name': 'Account Created',
                'slug': 'account_created',
                'subject': '👋 Your Account Has Been Created',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">Welcome to {{{{ school_name }}}}!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hi <strong>{{{{ user_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">An account has been created for you on the Registra platform.</p>
                    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #667eea;">Your Login Credentials:</p>
                        <p style="margin: 5px 0; color: #1a202c;"><strong>Login URL:</strong> {{{{ login_url }}}}</p>
                        <p style="margin: 5px 0; color: #1a202c;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">{{{{ temp_password }}}}</code></p>
                    </div>
                    <center>
                        <a href="{{{{ login_url }}}}" style="{button_style}">Login Now →</a>
                    </center>
                    <p style="font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; color: #dc2626;"><strong>Important:</strong> Please change your password after your first login.</p>
                """),
                'variables': {'user_name': 'Jane Smith', 'school_name': 'Example School', 'login_url': 'https://example.myregistra.net/login', 'temp_password': 'TempPass123'}
            },

            # 8. Account Activated
            {
                'name': 'Account Activated',
                'slug': 'account_activated',
                'subject': '✅ Your Account is Now Active',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #10b981; margin: 0 0 20px 0;">Account Activated!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hi <strong>{{{{ user_name }}}}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Your account at <strong>{{{{ school_name }}}}</strong> has been activated.</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">You can now access all features and start using the platform.</p>
                    <center>
                        <a href="{{{{ login_url }}}}" style="{button_style}">Access Platform →</a>
                    </center>
                """),
                'variables': {'user_name': 'John Doe', 'school_name': 'Example School', 'login_url': 'https://example.myregistra.net/login'}
            },

            # 9. Invitation Email
            {
                'name': 'Invitation Email',
                'slug': 'invitation_email',
                'subject': '📧 You\'re Invited to Join {{ school_name }}',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">You're Invited!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;"><strong>{{{{ inviter_name }}}}</strong> has invited you to join <strong>{{{{ school_name }}}}</strong> on Registra.</p>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">Click the button below to accept the invitation and create your account.</p>
                    <center>
                        <a href="{{{{ invitation_url }}}}" style="{button_style}">Accept Invitation →</a>
                    </center>
                    <p style="font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; color: #6c757d;">This invitation will expire in 7 days.</p>
                """),
                'variables': {'inviter_name': 'Admin User', 'school_name': 'Example School', 'invitation_url': 'https://myregistra.net/invitation/token'}
            },

            # 10. Payment Received
            {
                'name': 'Payment Received',
                'slug': 'payment_received',
                'subject': '✅ Payment Received - Thank You!',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #10b981; margin: 0 0 20px 0;">Payment Successful!</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Thank you for your payment!</p>
                    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #065f46;">Payment Details:</p>
                        <p style="margin: 5px 0; color: #065f46;"><strong>Amount:</strong> {{{{ amount }}}}</p>
                        <p style="margin: 5px 0; color: #065f46;"><strong>Date:</strong> {{{{ payment_date }}}}</p>
                    </div>
                    <center>
                        <a href="{{{{ receipt_url }}}}" style="{button_style}">Download Receipt →</a>
                    </center>
                """),
                'variables': {'amount': '$99.00', 'payment_date': '2024-02-10', 'receipt_url': 'https://myregistra.net/receipts/123'}
            },

            # 11. Payment Failed
            {
                'name': 'Payment Failed',
                'slug': 'payment_failed',
                'subject': '❌ Payment Failed',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #dc2626; margin: 0 0 20px 0;">Payment Failed</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">We were unable to process your payment.</p>
                    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #991b1b;">Payment Details:</p>
                        <p style="margin: 5px 0; color: #7f1d1d;"><strong>Amount:</strong> {{{{ amount }}}}</p>
                        <p style="margin: 5px 0; color: #7f1d1d;"><strong>Reason:</strong> {{{{ reason }}}}</p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">Please update your payment method and try again.</p>
                    <center>
                        <a href="{{{{ retry_url }}}}" style="{button_style}">Retry Payment →</a>
                    </center>
                """),
                'variables': {'amount': '$99.00', 'reason': 'Insufficient funds', 'retry_url': 'https://myregistra.net/billing'}
            },

            # 12. Invoice Generated
            {
                'name': 'Invoice Generated',
                'slug': 'invoice_generated',
                'subject': '📄 New Invoice #{{ invoice_number }}',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">New Invoice Available</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">A new invoice has been generated for your account.</p>
                    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #667eea;">Invoice Details:</p>
                        <p style="margin: 5px 0; color: #1a202c;"><strong>Invoice Number:</strong> #{{{{ invoice_number }}}}</p>
                        <p style="margin: 5px 0; color: #1a202c;"><strong>Amount Due:</strong> {{{{ amount }}}}</p>
                        <p style="margin: 5px 0; color: #1a202c;"><strong>Due Date:</strong> {{{{ due_date }}}}</p>
                    </div>
                    <center>
                        <a href="{{{{ invoice_url }}}}" style="{button_style}">View Invoice →</a>
                    </center>
                """),
                'variables': {'invoice_number': 'INV-2024-001', 'amount': '$99.00', 'due_date': '2024-03-01', 'invoice_url': 'https://myregistra.net/invoices/001'}
            },

            # 13. System Notification
            {
                'name': 'System Notification',
                'slug': 'system_notification',
                'subject': '📢 {{ title }}',
                'body_html': base_style.format(content=f"""
                    <h2 style="color: #1a202c; margin: 0 0 20px 0;">{{{{ title }}}}</h2>
                    <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                        {{{{ message }}}}
                    </div>
                    <center style="margin-top: 30px;">
                        <a href="{{{{ action_url }}}}" style="{button_style}">Take Action →</a>
                    </center>
                """),
                'variables': {'title': 'Important Update', 'message': 'This is an important system notification.', 'action_url': 'https://myregistra.net'}
            }
        ]

        for t_data in templates:
            template, created = EmailTemplate.objects.update_or_create(
                slug=t_data['slug'],
                defaults={
                    'name': t_data['name'],
                    'subject': t_data['subject'],
                    'body_html': t_data['body_html'],
                    'variables': t_data['variables']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created template: {template.name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"✓ Updated template: {template.name}"))

        self.stdout.write(self.style.SUCCESS(f"\n🎉 Successfully seeded {len(templates)} email templates!"))
