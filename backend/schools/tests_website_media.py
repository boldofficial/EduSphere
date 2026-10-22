"""Website media library, gallery and permanent public image addresses."""

import base64
import io
from unittest import mock

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from core.website_media import is_website_path, path_from_url, public_url
from schools.models import School, SchoolSettings, WebsiteMedia
from users.models import User

MEMORY_STORAGE = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


def image_bytes(fmt="JPEG", size=(2400, 1600), color="navy"):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, fmt)
    return buf.getvalue()


class PathTests(TestCase):
    def test_only_website_folder_paths_are_public(self):
        self.assertTrue(is_website_path("website/12/abc123.webp"))
        for bad in ("passports/abc.jpg", "website/12/../../passports/x.jpg", "website/x/abc.webp", "website/12/a.svg"):
            self.assertFalse(is_website_path(bad), bad)

    def test_url_round_trip(self):
        url = public_url("website/3/abc.webp")
        self.assertEqual(url, "/site-media/website/3/abc.webp")
        self.assertEqual(path_from_url(url), "website/3/abc.webp")
        self.assertEqual(
            path_from_url("https://school.example/site-media/website/3/abc.webp?x=1"), "website/3/abc.webp"
        )
        self.assertIsNone(path_from_url("/site-media/passports/abc.jpg"))


@override_settings(STORAGES=MEMORY_STORAGE)
class MediaLibraryTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Gallery School", domain="gallery-school")
        SchoolSettings.objects.get_or_create(school=self.school)
        self.admin = User.objects.create_user(
            username="admin@gallery", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.teacher = User.objects.create_user(
            username="teacher@gallery", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        self.client = APIClient()
        self.headers = {"HTTP_X_TENANT_ID": self.school.domain}

    def upload(self, *files, **data):
        return self.client.post(
            "/api/schools/website-media/", {"files": list(files), **data}, format="multipart", **self.headers
        )

    def test_upload_optimises_and_appears_in_public_gallery(self):
        self.client.force_authenticate(self.admin)
        r = self.upload(SimpleUploadedFile("sports_day.jpg", image_bytes(), "image/jpeg"), album="Sports Day")
        self.assertEqual(r.status_code, 201, r.data)
        item = r.data["results"][0]
        self.assertTrue(item["url"].startswith("/site-media/website/"))
        self.assertTrue(item["url"].endswith(".webp"))
        self.assertEqual((item["width"], item["height"]), (1920, 1280))  # resized from 2400x1600
        self.assertEqual(item["alt_text"], "sports day")
        self.assertEqual(item["album"], "Sports Day")

        self.client.force_authenticate(None)
        gallery = self.client.get("/api/core/public-settings/", **self.headers).data["gallery"]
        self.assertEqual([g["id"] for g in gallery], [item["id"]])

        served = self.client.get(item["url"].replace("/site-media/", "/api/core/site-media/"))
        self.assertEqual(served.status_code, 200)
        self.assertIn("immutable", served["Cache-Control"])

    def test_bad_files_are_reported_without_blocking_good_ones(self):
        self.client.force_authenticate(self.admin)
        r = self.upload(
            SimpleUploadedFile("ok.png", image_bytes("PNG", (400, 300)), "image/png"),
            SimpleUploadedFile("evil.png", b"<svg onload=alert(1)>", "image/png"),
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(r.data["results"]), 1)
        self.assertEqual(r.data["errors"][0]["file"], "evil.png")

    def test_quota_is_enforced(self):
        self.client.force_authenticate(self.admin)
        with mock.patch("schools.views_media.quota_bytes", return_value=10):
            r = self.upload(SimpleUploadedFile("big.jpg", image_bytes(), "image/jpeg"))
        self.assertEqual(r.status_code, 400)
        self.assertIn("storage is full", r.data["detail"])
        self.assertFalse(WebsiteMedia.objects.exists())

    def test_hidden_items_reorder_and_delete(self):
        self.client.force_authenticate(self.admin)
        a, b = self.upload(
            SimpleUploadedFile("a.png", image_bytes("PNG", (50, 50)), "image/png"),
            SimpleUploadedFile("b.png", image_bytes("PNG", (50, 50)), "image/png"),
        ).data["results"]
        self.client.post(
            "/api/schools/website-media/reorder/", {"ids": [b["id"], a["id"]]}, format="json", **self.headers
        )
        self.client.patch(
            f"/api/schools/website-media/{a['id']}/", {"show_in_gallery": False}, format="json", **self.headers
        )
        listing = self.client.get("/api/schools/website-media/", **self.headers).data
        self.assertEqual([m["id"] for m in listing["results"]], [b["id"], a["id"]])
        self.assertGreater(listing["usage"]["used_bytes"], 0)
        gallery = self.client.get("/api/core/public-settings/", **self.headers).data["gallery"]
        self.assertEqual([g["id"] for g in gallery], [b["id"]])

        path = WebsiteMedia.objects.get(id=b["id"]).path
        with self.captureOnCommitCallbacks(execute=True):
            r = self.client.delete(f"/api/schools/website-media/{b['id']}/", **self.headers)
        self.assertEqual(r.status_code, 204)
        self.assertFalse(default_storage.exists(path))

    def test_only_admins_manage_media_and_other_schools_cannot_see_it(self):
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.get("/api/schools/website-media/", **self.headers).status_code, 403)
        self.client.force_authenticate(self.admin)
        item = self.upload(SimpleUploadedFile("a.png", image_bytes("PNG", (50, 50)), "image/png")).data["results"][0]

        other = School.objects.create(name="Other", domain="other-gallery")
        other_admin = User.objects.create_user(
            username="admin@other", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=other
        )
        self.client.force_authenticate(other_admin)
        self.assertEqual(
            self.client.get("/api/schools/website-media/", HTTP_X_TENANT_ID="other-gallery").data["results"], []
        )
        r = self.client.delete(f"/api/schools/website-media/{item['id']}/", HTTP_X_TENANT_ID="other-gallery")
        self.assertEqual(r.status_code, 404)

    def test_site_media_never_serves_private_files(self):
        default_storage.save("passports/secret.jpg", ContentFile(image_bytes()))
        self.assertEqual(self.client.get("/api/core/site-media/passports/secret.jpg").status_code, 404)

    def test_settings_images_are_stored_as_website_media(self):
        self.client.force_authenticate(self.admin)
        data_url = "data:image/jpeg;base64," + base64.b64encode(image_bytes()).decode()
        r = self.client.put("/api/core/settings/", {"landing_hero_image": data_url}, format="json", **self.headers)
        self.assertEqual(r.status_code, 200, r.data)
        hero = r.data["landing_hero_image"]
        self.assertTrue(hero.startswith(f"/site-media/website/{self.school.pk}/"), hero)
        # Sending the same address back (as the CMS does on every save) keeps the stored path.
        self.client.put("/api/core/settings/", {"landing_hero_image": hero}, format="json", **self.headers)
        self.assertEqual(SchoolSettings.objects.get(school=self.school).landing_hero_image, path_from_url(hero))
