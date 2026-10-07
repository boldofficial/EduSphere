from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import School, SchoolPaymentConfig


class SchoolPaymentSettingsTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school_a = School.objects.create(name="School A", domain="school-a")
        self.school_b = School.objects.create(name="School B", domain="school-b")

        self.admin_a = get_user_model().objects.create_user(
            username="admin-a",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_a,
        )
        self.teacher_a = get_user_model().objects.create_user(
            username="teacher-a",
            password="password123",
            role="TEACHER",
            school=self.school_a,
        )
        self.admin_b = get_user_model().objects.create_user(
            username="admin-b",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_b,
        )

    def test_school_admin_gets_default_payment_config(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get("/api/schools/payment-settings/", HTTP_X_TENANT_ID=self.school_a.domain)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["enable_cash"])
        self.assertTrue(response.data["enable_bank_transfer"])
        self.assertEqual(response.data["default_payment_method"], "bank_transfer")
        self.assertNotIn("enable_paystack", response.data)

    def test_school_admin_can_update_bank_details(self):
        self.client.force_authenticate(user=self.admin_a)
        payload = {
            "enable_cash": True,
            "enable_bank_transfer": True,
            "default_payment_method": "bank_transfer",
            "bank_name": "Demo Bank",
            "bank_account_name": "School A",
            "bank_account_number": "0123456789",
        }
        response = self.client.put(
            "/api/schools/payment-settings/",
            payload,
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bank_account_number"], "0123456789")
        self.assertEqual(response.data["enabled_methods"], ["cash", "bank_transfer"])

    def test_bank_transfer_requires_account_details(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.put(
            "/api/schools/payment-settings/",
            {"enable_bank_transfer": True, "bank_name": "Demo Bank"},
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bank_account_number", response.data["errors"])

    def test_online_gateway_is_rejected_as_default(self):
        self.client.force_authenticate(user=self.admin_a)
        payload = {
            "enable_cash": True,
            "enable_bank_transfer": False,
            "default_payment_method": "paystack",
        }
        response = self.client.put(
            "/api/schools/payment-settings/",
            payload,
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("default_payment_method", response.data["errors"])

    def test_non_admin_cannot_update_payment_settings(self):
        self.client.force_authenticate(user=self.teacher_a)
        response = self.client.put(
            "/api/schools/payment-settings/",
            {"enable_cash": False},
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tenant_mismatch_is_denied(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get("/api/schools/payment-settings/", HTTP_X_TENANT_ID=self.school_b.domain)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_payment_options_show_bank_details(self):
        SchoolPaymentConfig.objects.create(
            school=self.school_b,
            enable_cash=True,
            enable_bank_transfer=True,
            default_payment_method="bank_transfer",
            bank_name="Demo Bank",
            bank_account_name="School B",
            bank_account_number="1234567890",
        )

        response = self.client.get("/api/schools/public/payment-options/", HTTP_X_TENANT_ID=self.school_b.domain)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bank_account_number"], "1234567890")
        self.assertEqual(response.data["enabled_methods"], ["cash", "bank_transfer"])
        self.assertNotIn("paystack_public_key", response.data)
