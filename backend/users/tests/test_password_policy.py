from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase

from schools.models import School


class PasswordPolicyTests(APITestCase):
    def setUp(self):
        school = School.objects.create(name="Policy School", domain="policy-school")
        self.user = get_user_model().objects.create_user(
            username="admin@policy",
            email="admin@policy.ng",
            password="Original!Pass2026",
            school=school,
            role="SCHOOL_ADMIN",
        )

    def _reset(self, new_password):
        self.user.refresh_from_db()
        return self.client.post(
            "/api/users/password-reset-confirm/",
            {
                "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                "token": PasswordResetTokenGenerator().make_token(self.user),
                "new_password": new_password,
            },
            format="json",
        )

    def test_weak_password_is_rejected(self):
        response = self._reset("password1")
        self.assertEqual(response.status_code, 400)

    def test_cannot_reuse_current_or_recent_password(self):
        self.assertEqual(self._reset("Original!Pass2026").status_code, 400)
        self.assertEqual(self._reset("Second!Strong2026").status_code, 200)
        # The first password is now in history and still cannot be reused.
        self.assertEqual(self._reset("Original!Pass2026").status_code, 400)

    def test_strong_new_password_is_accepted(self):
        response = self._reset("Brand-New!Secret77")
        self.assertEqual(response.status_code, 200, response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Brand-New!Secret77"))
