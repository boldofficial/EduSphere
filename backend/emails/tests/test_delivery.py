"""Email delivery: configuration, templates, and every platform notification reaching the right people."""

from datetime import timedelta
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from emails.models import EmailLog, EmailTemplate
from emails.utils import send_template_email
from schools.models import PlatformSettings, School, SubscriptionPlan, Subscription
from users.models import User

LOCMEM = "django.core.mail.backends.locmem.EmailBackend"


def run_now(slug, recipient, context=None, campaign_id=None, reply_to=None):
    """Stand-in for Celery: deliver immediately."""
    return send_template_email(slug, recipient, context, reply_to=reply_to)


def configure_smtp():
    PlatformSettings.objects.update_or_create(
        id=1,
        defaults={
            "email_provider": "smtp",
            "email_host": "smtp.example.com",
            "email_user": "mailer",
            "email_password": "secret",
            "email_from": "noreply@myregistra.net",
        },
    )


@override_settings(EMAIL_BACKEND=LOCMEM, DEBUG=False)
@mock.patch("emails.tasks.send_email_task.delay", side_effect=run_now)
class DeliveryTests(TestCase):
    def setUp(self):
        configure_smtp()
        self.school = School.objects.create(name="Mail School", domain="mail-school", email="office@mail.test")
        self.admin = User.objects.create_user(
            username="head@mail.test",
            email="head@mail.test",
            password="Strong-Pass!2026",
            role="SCHOOL_ADMIN",
            school=self.school,
        )

    def test_missing_configuration_is_reported_not_faked(self, _delay):
        PlatformSettings.objects.all().delete()
        with override_settings(EMAIL_HOST_USER=None, EMAIL_HOST_PASSWORD=None):
            self.assertFalse(send_template_email("test_email", "x@example.com", {"provider": "SMTP"}))
        log = EmailLog.objects.get()
        self.assertEqual(log.status, "failed")
        self.assertIn("not configured", log.error_message)
        self.assertEqual(len(mail.outbox), 0)

    def test_built_in_template_is_used_and_saved_template_overrides_it(self, _delay):
        self.assertTrue(
            send_template_email(
                "school_approved", "a@example.com", {"school_name": "Mail School", "login_url": "https://x/login"}
            )
        )
        self.assertIn("Mail School is now active", mail.outbox[0].subject)
        html = mail.outbox[0].alternatives[0][0]
        self.assertEqual(html.count("<html"), 1)  # one layout, not a layout inside a layout

        EmailTemplate.objects.create(
            name="Custom", slug="school_approved", subject="Custom {{ school_name }}", body_html="<p>Hi</p>"
        )
        send_template_email("school_approved", "a@example.com", {"school_name": "Mail School"})
        self.assertEqual(mail.outbox[1].subject, "Custom Mail School")

    def test_registration_welcomes_admin_and_school_and_tells_super_admins(self, _delay):
        User.objects.create_user(
            username="boss", email="boss@myregistra.net", password="Strong-Pass!2026", role="SUPER_ADMIN"
        )
        SubscriptionPlan.objects.update_or_create(
            slug="free", defaults={"name": "Free", "price": 0, "duration_days": 365, "is_active": True}
        )
        with self.captureOnCommitCallbacks(execute=True):
            r = APIClient().post(
                "/api/schools/register/",
                {
                    "school_name": "Heritage Test",
                    "domain": "heritage-test",
                    "email": "owner@heritage.test",
                    "school_email": "info@heritage.test",
                    "password": "Strong-Pass!2026",
                    "contact_person": "Mrs Owner",
                    "plan_slug": "free",
                },
                format="json",
            )
        self.assertEqual(r.status_code, 201, r.data)
        by_recipient = {m.to[0]: m for m in mail.outbox}
        self.assertIn("Welcome to Registra", by_recipient["owner@heritage.test"].subject)
        self.assertIn("info@heritage.test", by_recipient)
        self.assertIn("heritage-test", by_recipient["owner@heritage.test"].alternatives[0][0])
        self.assertIn("New school registered", by_recipient["boss@myregistra.net"].subject)

    def test_website_enquiry_reaches_school_and_admins_with_reply_to_the_parent(self, _delay):
        with self.captureOnCommitCallbacks(execute=True):
            r = APIClient().post(
                "/api/schools/public/enquiry/",
                {"name": "Mrs Ade", "email": "ade@example.com", "message": "<b>Space in JSS 1?</b>"},
                format="json",
                HTTP_X_TENANT_ID=self.school.domain,
            )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(sorted(m.to[0] for m in mail.outbox), ["head@mail.test", "office@mail.test"])
        self.assertEqual(mail.outbox[0].reply_to, ["ade@example.com"])
        self.assertIn("&lt;b&gt;Space in JSS 1?&lt;/b&gt;", mail.outbox[0].alternatives[0][0])

    def test_expired_subscription_notifies_the_school(self, _delay):
        from schools.tasks import check_subscription_expiry

        plan = SubscriptionPlan.objects.create(name="Paid", slug="paid-x", price=1)
        Subscription.objects.update_or_create(
            school=self.school,
            defaults={"plan": plan, "status": "active", "end_date": timezone.now() - timedelta(days=1)},
        )
        with self.captureOnCommitCallbacks(execute=True):
            check_subscription_expiry()
        self.assertTrue(any("has expired" in m.subject for m in mail.outbox))

    def test_super_admin_can_check_status_and_send_a_test(self, _delay):
        boss = User.objects.create_user(
            username="boss2", email="boss2@myregistra.net", password="Strong-Pass!2026", role="SUPER_ADMIN"
        )
        client = APIClient()
        client.force_authenticate(boss)
        status = client.get("/api/emails/status/").data
        self.assertTrue(status["configured"])
        self.assertNotIn("secret", str(status))
        r = client.post("/api/emails/status/", {"recipient": "me@example.com"}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(mail.outbox[-1].to, ["me@example.com"])

        client.force_authenticate(self.admin)
        self.assertEqual(client.get("/api/emails/status/").status_code, 403)

    def test_announcement_can_be_emailed_to_school_admins(self, _delay):
        boss = User.objects.create_user(
            username="boss3", email="boss3@myregistra.net", password="Strong-Pass!2026", role="SUPER_ADMIN"
        )
        client = APIClient()
        client.force_authenticate(boss)
        with (
            mock.patch(
                "emails.tasks.send_announcement_task.delay",
                side_effect=lambda i: __import__("emails.tasks").tasks.send_announcement_task(i),
            ),
            mock.patch("emails.tasks.time.sleep"),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                r = client.post(
                    "/api/schools/governance/",
                    {"title": "Maintenance on Saturday", "message": "Short downtime 1–2am.", "send_email": True},
                    format="json",
                )
        self.assertTrue(r.data["emailed"])
        self.assertEqual([m.to[0] for m in mail.outbox], ["head@mail.test"])
        self.assertIn("Maintenance on Saturday", mail.outbox[0].subject)
