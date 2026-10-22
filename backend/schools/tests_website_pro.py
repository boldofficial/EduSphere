"""Website kit: contact enquiries, revision history, theme/content validation, public events."""

from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from academic.models import SchoolEvent
from core.website_content import ContentError, clean_social, clean_theme
from schools.models import School, SchoolSettings, WebsiteEnquiry, WebsiteRevision
from users.models import User


class ContentValidationTests(TestCase):
    def test_theme_and_social_rules(self):
        self.assertEqual(clean_theme({"preset": "royal", "heading_font": "playfair"})["preset"], "royal")
        for bad in ({"preset": "neon"}, {"accent_color": "red"}, {"body_font": "comic-sans"}):
            with self.assertRaises(ContentError):
                clean_theme(bad)
        self.assertEqual(
            clean_social({"facebook": "https://facebook.com/school"})["facebook"], "https://facebook.com/school"
        )
        for bad in ({"facebook": "javascript:alert(1)"}, {"x": "http://x.com/a"}, {"whatsapp": "call me"}):
            with self.assertRaises(ContentError):
                clean_social(bad)


class WebsiteKitTests(TestCase):
    def setUp(self):
        cache.clear()
        self.school = School.objects.create(name="Kit School", domain="kit-school", email="office@kit.test")
        self.settings, _ = SchoolSettings.objects.get_or_create(school=self.school)
        self.admin = User.objects.create_user(
            username="admin@kit", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = APIClient()
        self.headers = {"HTTP_X_TENANT_ID": self.school.domain}

    def enquire(self, **data):
        body = {"name": "Mrs Ade", "email": "ade@example.com", "message": "Is there space in JSS 1?", **data}
        return self.client.post("/api/schools/public/enquiry/", body, format="json", **self.headers)

    @mock.patch("emails.tasks.send_custom_email_task.delay")
    def test_enquiry_is_saved_for_this_school_and_emailed_to_it(self, send):
        with self.captureOnCommitCallbacks(execute=True):
            r = self.enquire(phone="0801 234 5678")
        self.assertEqual(r.status_code, 201, r.data)
        enquiry = WebsiteEnquiry.objects.get()
        self.assertEqual(enquiry.school, self.school)
        send.assert_called_once()
        self.assertEqual(send.call_args.args[0], "office@kit.test")
        self.assertIn("Is there space in JSS 1?", send.call_args.args[2])

    def test_enquiry_validation_and_honeypot(self):
        self.assertEqual(self.enquire(email="not-an-email").status_code, 400)
        self.assertEqual(self.enquire(message="").status_code, 400)
        r = self.enquire(website="http://spam.example")  # bots fill the hidden field
        self.assertEqual(r.status_code, 201)
        self.assertFalse(WebsiteEnquiry.objects.exists())

    def test_message_html_is_escaped_in_the_email(self):
        with mock.patch("emails.tasks.send_custom_email_task.delay") as send:
            with self.captureOnCommitCallbacks(execute=True):
                self.enquire(message="<script>alert(1)</script>")
        self.assertNotIn("<script>", send.call_args.args[2])

    def test_inbox_is_admin_only_and_per_school(self):
        self.enquire()
        other = School.objects.create(name="Other", domain="other-kit")
        self.client.post(
            "/api/schools/public/enquiry/",
            {"name": "X", "email": "x@example.com", "message": "hi"},
            format="json",
            HTTP_X_TENANT_ID="other-kit",
        )
        self.client.force_authenticate(self.admin)
        rows = self.client.get("/api/schools/website-enquiries/", **self.headers).data["results"]
        self.assertEqual([r["name"] for r in rows], ["Mrs Ade"])
        self.assertEqual(self.client.get("/api/schools/website-enquiries/summary/", **self.headers).data["new"], 1)
        r = self.client.patch(
            f"/api/schools/website-enquiries/{rows[0]['id']}/", {"status": "replied"}, format="json", **self.headers
        )
        self.assertEqual(r.data["status"], "replied")
        self.assertEqual(WebsiteEnquiry.objects.filter(school=other).count(), 1)

        teacher = User.objects.create_user(
            username="t@kit", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        self.client.force_authenticate(teacher)
        self.assertEqual(self.client.get("/api/schools/website-enquiries/", **self.headers).status_code, 403)

    def test_publishing_keeps_versions_that_can_be_restored(self):
        self.client.force_authenticate(self.admin)
        self.client.put("/api/core/settings/", {"landing_hero_title": "First title"}, format="json", **self.headers)
        self.client.put("/api/core/settings/", {"landing_hero_title": "Second title"}, format="json", **self.headers)
        versions = self.client.get("/api/schools/website-revisions/", **self.headers).data
        self.assertEqual(len(versions), 2)
        first = versions[-1]
        r = self.client.post(f"/api/schools/website-revisions/{first['id']}/restore/", **self.headers)
        self.assertEqual(r.status_code, 200)
        self.settings.refresh_from_db()
        self.assertEqual(self.settings.landing_hero_title, "First title")
        self.assertEqual(WebsiteRevision.objects.filter(school=self.school).count(), 3)  # restore is a version too

    def test_non_website_settings_do_not_create_versions(self):
        self.client.force_authenticate(self.admin)
        self.client.put("/api/core/settings/", {"promotion_threshold": 45}, format="json", **self.headers)
        self.assertFalse(WebsiteRevision.objects.exists())

    def test_public_settings_include_content_and_only_published_upcoming_events(self):
        now = timezone.now()
        SchoolEvent.objects.create(
            school=self.school, title="Open Day", start_date=now + timedelta(days=5), show_on_website=True
        )
        SchoolEvent.objects.create(school=self.school, title="Staff meeting", start_date=now + timedelta(days=2))
        SchoolEvent.objects.create(
            school=self.school, title="Old fair", start_date=now - timedelta(days=9), show_on_website=True
        )
        self.client.force_authenticate(self.admin)
        r = self.client.put(
            "/api/core/settings/",
            {
                "landing_faqs": [{"question": "Do you run a bus?", "answer": "Yes, on 4 routes."}],
                "landing_stats": [{"value": "25+", "label": "Years of excellence"}],
                "landing_theme": {"preset": "royal"},
                "landing_social": {"instagram": "https://instagram.com/kit"},
            },
            format="json",
            **self.headers,
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.client.force_authenticate(None)
        public = self.client.get("/api/core/public-settings/", **self.headers).data
        self.assertEqual([e["title"] for e in public["events"]], ["Open Day"])
        self.assertEqual(public["landing_faqs"][0]["question"], "Do you run a bus?")
        self.assertEqual(public["landing_theme"]["preset"], "royal")
        self.assertEqual(public["landing_social"]["instagram"], "https://instagram.com/kit")
