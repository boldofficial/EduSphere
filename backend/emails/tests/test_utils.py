from django.test import TestCase
from unittest.mock import patch
from emails.models import EmailTemplate, EmailLog
from emails.utils import send_template_email

class EmailUtilsTests(TestCase):
    def setUp(self):
        # Create a test template
        self.template = EmailTemplate.objects.create(
            name="Test Template",
            slug="test-template",
            subject="Hello {{ name }}",
            body_html="<p>Welcome to {{ platform_name }}!</p>",
            variables={"name": "User Name"}
        )

    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_send_template_email_renders_correctly(self, mock_mail_send):
        """Verify that variables are correctly rendered in subject and body."""
        mock_mail_send.return_value = 1
        
        recipient = "user@example.com"
        context = {"name": "John Doe", "platform_name": "EduSphere"}
        
        result = send_template_email("test-template", recipient, context=context)
        
        self.assertTrue(result)
        self.assertTrue(mock_mail_send.called)
        
        # Verify rendered context via the log
        log = EmailLog.objects.get(recipient=recipient)
        self.assertEqual(log.subject, "Hello John Doe")
        self.assertEqual(log.metadata.get("platform_name"), "EduSphere")

    @patch('emails.utils.logger.error')
    def test_send_template_email_handles_missing_template(self, mock_logger):
        """Verify handling of non-existent template slugs."""
        recipient = "user@example.com"
        
        result = send_template_email("non-existent-slug", recipient)
        
        self.assertFalse(result)
        # Verify a log entry was created even though no template was found
        self.assertEqual(EmailLog.objects.count(), 1)
        log = EmailLog.objects.first()
        self.assertEqual(log.status, "failed")
        self.assertIn("not found", log.error_message)

    @patch('django.core.mail.EmailMultiAlternatives.send')
    def test_send_template_email_creates_log(self, mock_mail_send):
        """Verify that an EmailLog entry is created upon sending."""
        mock_mail_send.return_value = 1
        
        send_template_email("test-template", "test@test.com", context={"name": "Tester"})
        
        self.assertEqual(EmailLog.objects.count(), 1)
        log = EmailLog.objects.first()
        self.assertEqual(log.recipient, "test@test.com")
        self.assertEqual(log.template, self.template)
        self.assertEqual(log.subject, "Hello Tester")

    def test_wrap_professional_email_logic(self):
        """Internal helper check: Verify wrapper contains common elements."""
        from emails.utils import wrap_professional_email
        
        content = "Test Body"
        wrapped = wrap_professional_email(content, platform_name="Registra")
        
        self.assertIn(content, wrapped)
        self.assertIn("Registra", wrapped)
        # Should also include basic layout elements from base_email.html (checking existence of typical strings)
        # Note: This assumes base_email.html exists and is accessible.
