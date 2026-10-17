"""S10–S12: sessions end when a school is blocked; uploads are type- and size-checked."""

import base64
import io
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework import serializers
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from academic.serializers.base import Base64ImageField
from schools.models import School, Subscription, SubscriptionPlan
from users.models import User


def png_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), "red").save(buf, "PNG")
    return buf.getvalue()


@override_settings(
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
)
class SessionAndUploadTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Refresh School", domain="refresh-school")
        plan = SubscriptionPlan.objects.create(name="Test plan", slug="test-plan-s10", price=0)
        self.sub, _ = Subscription.objects.update_or_create(
            school=self.school,
            defaults={"plan": plan, "status": "active", "end_date": timezone.now() + timedelta(days=365)},
        )
        self.user = User.objects.create_user(
            username="admin_refresh",
            email="a@refresh.test",
            password="Strong-Pass!2026",
            role="ADMIN",
            school=self.school,
        )
        self.client = APIClient()

    def refresh(self):
        return self.client.post(
            "/api/token/refresh/", {"refresh": str(RefreshToken.for_user(self.user))}, format="json"
        )

    def test_refresh_works_for_active_school(self):
        self.assertEqual(self.refresh().status_code, 200)

    def test_refresh_rejected_when_school_expired_or_suspended(self):
        for status in ("expired", "cancelled", "pending"):
            self.sub.status = status
            self.sub.save()
            self.assertEqual(self.refresh().status_code, 401, status)

    def test_refresh_rejected_for_deactivated_user(self):
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.refresh().status_code, 401)

    def upload(self, name, content, ctype):
        self.client.force_authenticate(self.user)
        return self.client.post(
            "/api/core/upload/", {"file": SimpleUploadedFile(name, content, ctype)}, format="multipart"
        )

    def test_upload_rejects_html_and_svg(self):
        self.assertEqual(self.upload("x.html", b"<script>alert(1)</script>", "text/html").status_code, 400)
        self.assertEqual(self.upload("x.svg", b"<svg onload=alert(1)>", "image/svg+xml").status_code, 400)

    def test_upload_rejects_fake_image(self):
        self.assertEqual(self.upload("x.png", b"<script>not an image</script>", "image/png").status_code, 400)

    def test_upload_accepts_real_image_with_real_extension(self):
        r = self.upload("photo.jpg", png_bytes(), "image/jpeg")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["path"].endswith(".png"))

    def test_base64_field_uses_real_type_and_rejects_garbage(self):
        field = Base64ImageField()
        good = "data:image/svg+xml;base64," + base64.b64encode(png_bytes()).decode()
        self.assertTrue(field.to_internal_value(good).endswith(".png"))
        bad = "data:image/png;base64," + base64.b64encode(b"<svg onload=alert(1)>").decode()
        with self.assertRaises(serializers.ValidationError):
            field.to_internal_value(bad)
