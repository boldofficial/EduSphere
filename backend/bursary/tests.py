from django.contrib.auth import get_user_model
from decimal import Decimal
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Class, Student
from bursary.models import Expense, FeeCategory, FeeItem, Payment, Scholarship, StudentFee
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


class DashboardRevenueCalculationTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Finance School", domain="finance-school")
        self.user = get_user_model().objects.create_user(
            username="finance-admin",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.user)

        self.student_class = Class.objects.create(name="JSS 2", school=self.school)
        self.student = Student.objects.create(
            school=self.school,
            student_no="ST002",
            names="Jane Doe",
            gender="Female",
            current_class=self.student_class,
        )
        self.category = FeeCategory.objects.create(name="Tuition", school=self.school)
        self.fee_item = FeeItem.objects.create(
            school=self.school,
            category=self.category,
            amount=Decimal("500000.00"),
            session="2025/2026",
            term="First Term",
        )
        self.scholarship = Scholarship.objects.create(
            school=self.school,
            name="Merit Scholarship",
            benefit_type="percentage",
            value=Decimal("10.00"),
        )
        StudentFee.objects.create(
            school=self.school,
            student=self.student,
            fee_item=self.fee_item,
            scholarship=self.scholarship,
            discount_amount=Decimal("25000.00"),
        )
        Payment.objects.create(
            school=self.school,
            student=self.student,
            amount=Decimal("100000.00"),
            reference="PAY-001",
            method="cash",
            recorded_by=self.user.username,
            session="2025/2026",
            term="First Term",
        )
        Expense.objects.create(
            school=self.school,
            title="Generator Fuel",
            amount=Decimal("20000.00"),
            category="utilities",
            recorded_by=self.user.username,
            session="2025/2026",
            term="First Term",
        )

    def test_dashboard_expected_revenue_uses_fee_item_not_missing_student_fee_amount(self):
        response = self.client.get("/api/dashboard/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_revenue = Decimal(str(response.data["expected_revenue"]))
        # 500,000 - 10% scholarship (50,000) - 25,000 discount = 425,000
        self.assertEqual(expected_revenue, Decimal("425000.00"))

    def test_financial_stats_filters_session_and_term(self):
        response = self.client.get(
            "/api/dashboard/financial-stats/",
            {"session": "2025/2026", "term": "First Term"},
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data["expected_revenue"])), Decimal("425000.00"))
