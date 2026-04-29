"""
Tests for Bursary Module - Payments, Fees, Expenses
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from academic.models import Class, Student
from schools.models import School

from .models import (
    Expense,
    FeeCategory,
    FeeItem,
    Payment,
    StudentFee,
)


class FeeCategoryAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-fees")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-fees",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)

    def test_create_fee_category(self):
        response = self.client.post(
            "/api/fee-categories/",
            {"name": "Tuition Fee", "description": "Core tuition", "is_optional": False},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Tuition Fee")

    def test_list_fee_categories(self):
        FeeCategory.objects.create(school=self.school, name="Test Category", is_optional=False)
        response = self.client.get("/api/fee-categories/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_update_fee_category(self):
        category = FeeCategory.objects.create(school=self.school, name="Original", is_optional=False)
        response = self.client.put(
            f"/api/fee-categories/{category.id}/",
            {"name": "Updated", "description": "Changed", "is_optional": True},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated")

    def test_delete_fee_category(self):
        category = FeeCategory.objects.create(school=self.school, name="To Delete", is_optional=False)
        response = self.client.delete(f"/api/fee-categories/{category.id}/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FeeCategory.objects.filter(id=category.id).exists())


class FeeItemAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-fee-items")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-fee-items",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        self.category = FeeCategory.objects.create(school=self.school, name="Tuition", is_optional=False)
        self.student_class = Class.objects.create(name="JSS 1", school=self.school)

    def test_create_fee_item(self):
        response = self.client.post(
            "/api/fee-items/",
            {
                "category": self.category.id,
                "amount": 50000.00,
                "session": "2025/2026",
                "term": "First Term",
                "target_class": self.student_class.id,
                "active": True,
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data["amount"]), 50000.00)

    def test_list_fee_items(self):
        FeeItem.objects.create(
            school=self.school,
            category=self.category,
            amount=50000,
            session="2025/2026",
            term="First Term",
            target_class=self.student_class,
        )
        response = self.client.get("/api/fee-items/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PaymentAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-payments")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-payments",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        
        self.student_class = Class.objects.create(name="JSS 1", school=self.school)
        self.student = Student.objects.create(
            school=self.school,
            student_no="ST001",
            names="John Doe",
            gender="Male",
            current_class=self.student_class,
        )
        self.category = FeeCategory.objects.create(school=self.school, name="Tuition", is_optional=False)

    def test_create_payment(self):
        response = self.client.post(
            "/api/payments/",
            {
                "student": self.student.id,
                "amount": 25000.00,
                "method": "bank_transfer",
                "status": "completed",
                "category": self.category.id,
                "remark": "First term payment",
                "session": "2025/2026",
                "term": "First Term",
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data["amount"]), 25000.00)
        self.assertIsNotNone(response.data["reference"])

    def test_list_payments(self):
        Payment.objects.create(
            school=self.school,
            student=self.student,
            amount=25000,
            method="bank_transfer",
            status="completed",
            category=self.category,
            session="2025/2026",
            term="First Term",
        )
        response = self.client.get("/api/payments/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)


class ExpenseAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-expenses")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-expenses",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)

    def test_create_expense(self):
        response = self.client.post(
            "/api/expenses/",
            {
                "title": "Office Supplies",
                "amount": 15000.00,
                "category": "supplies",
                "date": timezone.now().date().isoformat(),
                "session": "2025/2026",
                "term": "First Term",
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Office Supplies")

    def test_list_expenses(self):
        Expense.objects.create(
            school=self.school,
            title="Test Expense",
            amount=5000,
            category="supplies",
            session="2025/2026",
            term="First Term",
        )
        response = self.client.get("/api/expenses/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class StudentFeeAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-student-fees")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-student-fees",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        
        self.student_class = Class.objects.create(name="JSS 1", school=self.school)
        self.student = Student.objects.create(
            school=self.school,
            student_no="ST001",
            names="John Doe",
            gender="Male",
            current_class=self.student_class,
        )
        self.category = FeeCategory.objects.create(school=self.school, name="Tuition", is_optional=False)
        self.fee_item = FeeItem.objects.create(
            school=self.school,
            category=self.category,
            amount=50000,
            session="2025/2026",
            term="First Term",
            target_class=self.student_class,
        )

    def test_assign_fee_to_student(self):
        response = self.client.post(
            "/api/student-fees/",
            {"student": self.student.id, "fee_item": self.fee_item.id, "discount_amount": 5000},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data["discount_amount"]), 5000)

    def test_list_student_fees(self):
        StudentFee.objects.create(
            school=self.school,
            student=self.student,
            fee_item=self.fee_item,
            discount_amount=5000,
        )
        response = self.client.get("/api/student-fees/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TenantIsolationTests(APITestCase):
    """Test that tenant isolation works correctly"""

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
        self.admin_b = get_user_model().objects.create_user(
            username="admin-b",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_b,
        )

    def test_school_a_cannot_see_school_b_fees(self):
        """School A admin should not see School B's fee categories"""
        category_b = FeeCategory.objects.create(school=self.school_b, name="School B Fee", is_optional=False)
        
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get("/api/fee-categories/", HTTP_X_TENANT_ID=self.school_a.domain)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        category_ids = [c["id"] for c in response.data.get("results", [])]
        self.assertNotIn(category_b.id, category_ids)

    def test_cross_tenant_payment_isolation(self):
        """Payments should be isolated by tenant"""
        student_a = Student.objects.create(
            school=self.school_a,
            student_no="ST001",
            names="Student A",
            gender="Male",
        )
        category_a = FeeCategory.objects.create(school=self.school_a, name="Fee A", is_optional=False)
        payment_a = Payment.objects.create(
            school=self.school_a,
            student=student_a,
            amount=10000,
            method="cash",
            status="completed",
            category=category_a,
            session="2025/2026",
            term="First Term",
        )
        
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get(f"/api/payments/{payment_a.id}/", HTTP_X_TENANT_ID=self.school_a.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # School B admin should not see School A's payment
        self.client.force_authenticate(user=self.admin_b)
        response = self.client.get(f"/api/payments/{payment_a.id}/", HTTP_X_TENANT_ID=self.school_b.domain)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)