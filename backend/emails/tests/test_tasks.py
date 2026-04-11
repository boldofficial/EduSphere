from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from emails.models import EmailTemplate, EmailCampaign, EmailLog
from emails.tasks import send_email_task, process_campaign_task
from schools.models import School

User = get_user_model()

class EmailTasksTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Task School", domain="tasks")
        self.template = EmailTemplate.objects.create(
            name="Task Template",
            slug="task-template",
            subject="Task Subject",
            body_html="<p>Task Body</p>"
        )
        
        # Create some users for campaign testing
        self.admin = User.objects.create_user(
            username="admin@tasks.com", email="admin@tasks.com", password="pw", 
            role="SCHOOL_ADMIN", school=self.school
        )
        self.teacher = User.objects.create_user(
            username="teacher@tasks.com", email="teacher@tasks.com", password="pw", 
            role="TEACHER", school=self.school
        )

    @patch('emails.tasks.send_template_email')
    def test_send_email_task_orchestration(self, mock_send):
        """Verify that the celery task correctly calls the utility function."""
        send_email_task("task-template", "user@test.com", context={"key": "val"})
        mock_send.assert_called_once_with("task-template", "user@test.com", {"key": "val"}, campaign=None)

    @patch('emails.tasks.send_template_email')
    @patch('time.sleep', return_value=None) # Speed up test
    def test_process_campaign_filters_and_updates(self, mock_sleep, mock_send):
        """Verify that campaign processing filters by role and updates counts."""
        mock_send.return_value = True
        
        campaign = EmailCampaign.objects.create(
            title="Teacher Announcement",
            template=self.template,
            audience_filter={"role": "TEACHER", "school_id": self.school.id}
        )
        
        process_campaign_task(campaign.id)
        
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, "completed")
        self.assertEqual(campaign.total_recipients, 1) # Only the teacher
        self.assertEqual(campaign.sent_count, 1)
        
        # Verify it was sent to the teacher only
        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        self.assertEqual(args[1], self.teacher.email)

    @patch('emails.tasks.send_template_email')
    @patch('time.sleep', return_value=None)
    def test_process_campaign_handles_failures(self, mock_sleep, mock_send):
        """Verify that campaign records individual email failures."""
        mock_send.return_value = False
        
        campaign = EmailCampaign.objects.create(
            title="Failed Campaign",
            template=self.template,
            audience_filter={"role": "TEACHER"}
        )
        
        process_campaign_task(campaign.id)
        
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, "failed")
        self.assertEqual(campaign.failed_count, 1)
