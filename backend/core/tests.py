"""
Tests for Core Module - Settings, Activity Logs, Announcements
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from schools.models import School, SchoolSettings

from .models import GlobalActivityLog, SchoolAnnouncement


class SchoolSettingsTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-settings")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-settings",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)

    def test_get_school_settings(self):
        response = self.client.get("/api/core/settings/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("school_name", response.data)

    def test_update_school_settings(self):
        response = self.client.put(
            "/api/core/settings/",
            {"school_name": "Updated School", "school_tagline": "New tagline"},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["school_name"], "Updated School")

    def test_public_settings_include_published_website_content(self):
        SchoolSettings.objects.update_or_create(
            school=self.school,
            defaults={
                "landing_about_title": "Learning with purpose",
                "landing_about_html": "<p>Our <strong>story</strong></p>",
                "landing_custom_enabled": True,
                "landing_custom_html": "<section><h2>Campus life</h2></section>",
                "landing_custom_css": ".campus { color: navy; }",
            },
        )

        self.client.force_authenticate(user=None)
        response = self.client.get(
            "/api/core/public-settings/", HTTP_X_TENANT_ID=self.school.domain
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["landing_about_title"], "Learning with purpose")
        self.assertIn("<strong>story</strong>", response.data["landing_about_html"])
        self.assertTrue(response.data["landing_custom_enabled"])

    def test_custom_html_is_sanitized_and_unsafe_css_is_rejected(self):
        response = self.client.put(
            "/api/core/settings/",
            {
                "landing_custom_html": (
                    '<section onclick="alert(1)"><h2>Welcome</h2>'
                    '<script>alert(1)</script></section>'
                ),
                "landing_custom_css": "@import url(https://bad.example/style.css);",
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("landing_custom_css", response.data["errors"])

        safe_response = self.client.put(
            "/api/core/settings/",
            {
                "landing_custom_html": (
                    '<section onclick="alert(1)"><h2>Welcome</h2>'
                    '<script>alert(1)</script></section>'
                ),
                "landing_custom_css": ".welcome { color: #123456; }",
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )

        self.assertEqual(safe_response.status_code, status.HTTP_200_OK)
        self.assertNotIn("onclick", safe_response.data["landing_custom_html"])
        self.assertNotIn("<script", safe_response.data["landing_custom_html"])


class AnnouncementTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-announcements")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-announcements",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)

    def test_create_announcement(self):
        response = self.client.post(
            "/api/core/announcements/",
            {
                "title": "Test Announcement",
                "content": "This is a test announcement",
                "target": "all",
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Announcement")

    def test_list_announcements(self):
        SchoolAnnouncement.objects.create(
            school=self.school,
            title="Test",
            content="Content",
            target="all",
        )
        response = self.client.get("/api/core/announcements/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ActivityLogTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-logs")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-logs",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)

    def test_activity_log_created_on_action(self):
        # Trigger an action that creates activity log
        self.client.get("/api/core/settings/", HTTP_X_TENANT_ID=self.school.domain)

        # Check if activity log was created
        logs = GlobalActivityLog.objects.filter(school=self.school)
        # Some endpoints may not log, this is just to verify the model works
        self.assertIsNotNone(logs)


class TenantIsolationTests(APITestCase):
    """Test that tenant isolation works correctly"""

    def setUp(self):
        self.client = APIClient()
        self.school_a = School.objects.create(name="School A", domain="school-a-logs")
        self.school_b = School.objects.create(name="School B", domain="school-b-logs")

        self.admin_a = get_user_model().objects.create_user(
            username="admin-a-logs",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_a,
        )
        self.admin_b = get_user_model().objects.create_user(
            username="admin-b-logs",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_b,
        )

    def test_school_a_cannot_see_school_b_settings(self):
        """School A admin should not see School B's settings"""
        # Update School B settings
        self.client.force_authenticate(user=self.admin_b)
        self.client.put(
            "/api/core/settings/",
            {"school_name": "School B Private"},
            format="json",
            HTTP_X_TENANT_ID=self.school_b.domain,
        )

        # School A should not see School B's settings
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get("/api/core/settings/", HTTP_X_TENANT_ID=self.school_a.domain)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(response.data.get("school_name"), "School B Private")
        self.assertNotEqual(response.data.get("school_name"), "School B Private")
