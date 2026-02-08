from django.core.management.base import BaseCommand
from emails.models import EmailTemplate

class Command(BaseCommand):
    help = 'Seeds initial email templates'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Welcome Email',
                'slug': 'welcome_email',
                'subject': 'Welcome to {{ school_name }}!',
                'body_html': """
                    <h1>Welcome, {{ school_name }}!</h1>
                    <p>We are excited to have you on board.</p>
                    <p>You can access your dashboard at <a href="https://{{ domain }}.myregistra.net">https://{{ domain }}.myregistra.net</a></p>
                    <p>Regards,<br>The Registra Team</p>
                """,
                'variables': {'school_name': 'My School', 'domain': 'myschool'}
            },
            {
                'name': 'School Approved',
                'slug': 'school_approved',
                'subject': 'Your School "{{ school_name }}" has been approved!',
                'body_html': """
                    <h1>Great news, {{ school_name }}!</h1>
                    <p>Your school registration has been approved and is now active.</p>
                    <p>You can log in at: <a href="{{ login_url }}">{{ login_url }}</a></p>
                    <p>Regards,<br>The Registra Team</p>
                """,
                'variables': {'school_name': 'My School', 'login_url': 'https://myschool.myregistra.net/login'}
            },
            {
                'name': 'Password Reset',
                'slug': 'password_reset',
                'subject': 'Password Reset Request',
                'body_html': """
                    <h1>Password Reset</h1>
                    <p>You requested a password reset. Click the link below to set a new password:</p>
                    <p><a href="{{ reset_url }}">Reset Password</a></p>
                    <p>If you did not request this, please ignore this email.</p>
                """,
                'variables': {'reset_url': 'https://myregistra.net/reset-password/token'}
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
                self.stdout.write(self.style.SUCCESS(f"Created template: {template.name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Updated template: {template.name}"))
