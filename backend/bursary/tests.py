from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Class
from bursary.models import FeeCategory, FeeItem
from schools.models import School


class FeeItemCompatibilityTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Demo School", domain="demo-school")
        self.user = get_user_model().objects.create_user(
            username="bursar-admin",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.student_class = Class.objects.create(name="JSS 1", school=self.school)
        self.client.force_authenticate(user=self.user)

    def test_create_fee_with_name_payload_without_category(self):
        payload = {
            "name": "Tuition Fee",
            "amount": "500000.00",
            "class_id": None,
            "session": "2025/2026",
            "term": "First Term",
            "is_optional": False,
        }
        response = self.client.post(
            "/api/fees/",
            payload,
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        category = FeeCategory.objects.get(name="Tuition Fee", school=self.school)
        fee = FeeItem.objects.get(id=response.data["id"])
        self.assertEqual(fee.category_id, category.id)
        self.assertEqual(response.data["name"], "Tuition Fee")
        self.assertIsNone(response.data["class_id"])
        self.assertFalse(response.data["is_optional"])

    def test_create_fee_with_class_id_maps_to_target_class(self):
        payload = {
            "name": "Transport Fee",
            "amount": "20000.00",
            "class_id": self.student_class.id,
            "session": "2025/2026",
            "term": "First Term",
            "is_optional": True,
        }
        response = self.client.post(
            "/api/fees/",
            payload,
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        fee = FeeItem.objects.get(id=response.data["id"])
        self.assertEqual(fee.target_class_id, self.student_class.id)
        self.assertEqual(response.data["class_id"], self.student_class.id)
        self.assertTrue(response.data["is_optional"])
