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


class CustomDomainGatingTests(APITestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from .models import Subscription, SubscriptionPlan

        self.client = APIClient()
        self.free_plan = SubscriptionPlan.objects.get(slug="free")
        self.paid_plan = SubscriptionPlan.objects.get(slug="starter")
        self.end = timezone.now() + timedelta(days=365)

        self.free_school = School.objects.create(name="Free School", domain="free-school")
        Subscription.objects.create(school=self.free_school, plan=self.free_plan, status="active", end_date=self.end)
        self.free_admin = get_user_model().objects.create_user(
            username="admin@free-school", password="password123", role="SCHOOL_ADMIN", school=self.free_school
        )

        self.paid_school = School.objects.create(name="Paid School", domain="paid-school")
        Subscription.objects.create(school=self.paid_school, plan=self.paid_plan, status="active", end_date=self.end)
        self.paid_admin = get_user_model().objects.create_user(
            username="admin@paid-school", password="password123", role="SCHOOL_ADMIN", school=self.paid_school
        )

    def test_free_plan_cannot_set_custom_domain(self):
        self.client.force_authenticate(user=self.free_admin)
        response = self.client.put(
            "/api/core/settings/",
            {"custom_domain": "portal.freeschool.ng"},
            format="json",
            HTTP_X_TENANT_ID=self.free_school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("custom_domain", response.data["errors"])
        self.free_school.refresh_from_db()
        self.assertIsNone(self.free_school.custom_domain)

    def test_paid_plan_can_set_custom_domain(self):
        self.client.force_authenticate(user=self.paid_admin)
        response = self.client.put(
            "/api/core/settings/",
            {"custom_domain": "portal.paidschool.ng"},
            format="json",
            HTTP_X_TENANT_ID=self.paid_school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paid_school.refresh_from_db()
        self.assertEqual(self.paid_school.custom_domain, "portal.paidschool.ng")

    def test_free_plan_can_still_clear_custom_domain(self):
        self.free_school.custom_domain = "legacy.freeschool.ng"
        self.free_school.save()
        self.client.force_authenticate(user=self.free_admin)
        response = self.client.put(
            "/api/core/settings/",
            {"custom_domain": ""},
            format="json",
            HTTP_X_TENANT_ID=self.free_school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.free_school.refresh_from_db()
        self.assertIsNone(self.free_school.custom_domain)

    def test_custom_domain_allowed_property(self):
        self.assertTrue(self.paid_school.custom_domain_allowed)
        self.assertFalse(self.free_school.custom_domain_allowed)
        # Lapsed paid subscription loses access
        self.paid_school.subscription.status = "expired"
        self.paid_school.subscription.save()
        self.paid_school.refresh_from_db()
        self.assertFalse(self.paid_school.custom_domain_allowed)


class AnnualPlanTests(APITestCase):
    """Plans are installed by migration 0025; the test DB runs migrations, so they exist here."""

    def test_public_plans_list_all_tiers_in_price_order(self):
        response = self.client.get("/api/schools/plans/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [p["slug"] for p in response.data]
        self.assertEqual(slugs, ["free", "starter", "standard", "premium", "elite", "enterprise"])
        starter = response.data[1]
        self.assertEqual(float(starter["price"]), 150000.0)
        self.assertEqual(starter["max_students"], 150)
        self.assertTrue(starter["custom_domain_enabled"])
        self.assertFalse(response.data[0]["custom_domain_enabled"])
        self.assertTrue(response.data[-1]["is_custom_price"])

    def test_registration_starts_on_free_whatever_plan_is_picked(self):
        response = self.client.post(
            "/api/schools/register/",
            {
                "school_name": "New Academy",
                "domain": "newacademy",
                "email": "owner@newacademy.ng",
                "password": "StrongPass!2026",
                "plan_slug": "premium",
                "payment_method": "bank_transfer",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        school = School.objects.get(domain="newacademy")
        self.assertEqual(school.subscription.plan.slug, "free")
        self.assertEqual(school.student_limit, 30)
        self.assertFalse(school.custom_domain_allowed)


class StudentLimitTests(APITestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        from academic.models import Student

        from .models import Subscription, SubscriptionPlan

        self.school = School.objects.create(name="Tiny School", domain="tiny-school")
        plan = SubscriptionPlan.objects.create(name="Tiny", slug="tiny-test", price=0, max_students=2)
        Subscription.objects.create(
            school=self.school, plan=plan, status="active", end_date=timezone.now() + timedelta(days=365)
        )
        self.admin = get_user_model().objects.create_user(
            username="admin@tiny-school", password="password123", role="SCHOOL_ADMIN", school=self.school
        )
        for n in range(2):
            Student.objects.create(school=self.school, student_no=f"T{n}", names=f"Kid {n}", gender="Male")

    def test_cannot_add_student_beyond_plan_limit(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/academic/students/",
            {"student_no": "T9", "names": "One Too Many", "gender": "Female"},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("student limit", str(response.data))
