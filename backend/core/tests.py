from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, RequestFactory
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APITestCase, APIClient

from academic.models import Class, Subject
from bursary.models import FeeCategory
from core.models import Conversation, ConversationParticipant
from core.tenant_utils import get_request_school
from schools.models import School


class TenantUtilsTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.school_a = School.objects.create(name="School A", domain="school-a")
        self.school_b = School.objects.create(name="School B", domain="school-b")
        self.user = get_user_model().objects.create_user(
            username="admin-a",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_a,
        )
        self.super_admin = get_user_model().objects.create_user(
            username="root",
            password="password123",
            role="SUPER_ADMIN",
            is_superuser=True,
            is_staff=True,
        )

    def test_authenticated_user_uses_own_school(self):
        request = self.factory.get("/api/students/")
        request.user = self.user
        request.tenant = self.school_a

        self.assertEqual(get_request_school(request), self.school_a)

    def test_authenticated_tenant_mismatch_is_denied(self):
        request = self.factory.get("/api/students/")
        request.user = self.user
        request.tenant = self.school_b

        with self.assertRaises(PermissionDenied):
            get_request_school(request)

    def test_unauthenticated_request_can_use_tenant_context(self):
        request = self.factory.get("/api/public-stats/")
        request.user = AnonymousUser()
        request.tenant = self.school_a

        self.assertEqual(get_request_school(request), self.school_a)

    def test_super_admin_can_scope_to_tenant(self):
        request = self.factory.get("/api/conversations/")
        request.user = self.super_admin
        request.tenant = self.school_b

        self.assertEqual(get_request_school(request), self.school_b)


class TenantIsolationAPITests(APITestCase):
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

        self.class_b = Class.objects.create(name="JSS 1", school=self.school_b)
        self.subject_b = Subject.objects.create(name="Mathematics", school=self.school_b)
        self.category_b = FeeCategory.objects.create(name="Tuition", school=self.school_b)

        self.conversation_b = Conversation.objects.create(school=self.school_b, type="DIRECT")
        ConversationParticipant.objects.create(user=self.admin_b, conversation=self.conversation_b)

        self.client.force_authenticate(user=self.admin_a)

    def test_matching_tenant_header_allows_tenant_scoped_lists(self):
        endpoints = [
            "/api/subjects/",
            "/api/fee-categories/",
            "/api/learning/assignments/",
            "/api/conversations/",
        ]
        for endpoint in endpoints:
            response = self.client.get(endpoint, HTTP_X_TENANT_ID=self.school_a.domain)
            self.assertEqual(response.status_code, status.HTTP_200_OK, endpoint)

    def test_mismatched_tenant_header_is_denied_on_tenant_scoped_lists(self):
        endpoints = [
            "/api/subjects/",
            "/api/fee-categories/",
            "/api/learning/assignments/",
            "/api/conversations/",
        ]
        for endpoint in endpoints:
            response = self.client.get(endpoint, HTTP_X_TENANT_ID=self.school_b.domain)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, endpoint)

    def test_conversation_create_rejects_cross_tenant_participant(self):
        response = self.client.post(
            "/api/conversations/",
            {"type": "DIRECT", "participant_ids": [self.admin_b.id]},
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("same school", str(response.data).lower())

    def test_message_create_rejects_cross_tenant_conversation(self):
        response = self.client.post(
            "/api/messages/",
            {"conversation": str(self.conversation_b.id), "body": "hello"},
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_fee_item_create_rejects_cross_tenant_category(self):
        response = self.client.post(
            "/api/fee-items/",
            {
                "category": self.category_b.id,
                "amount": "15000.00",
                "session": "2025/2026",
                "term": "First Term",
                "active": True,
            },
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_text = str(response.data).lower()
        self.assertIn("category", error_text)

    def test_assignment_create_rejects_cross_tenant_class_and_subject(self):
        response = self.client.post(
            "/api/learning/assignments/",
            {
                "title": "Algebra Homework",
                "description": "Solve equations",
                "student_class": self.class_b.id,
                "subject": self.subject_b.id,
                "due_date": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            },
            format="json",
            HTTP_X_TENANT_ID=self.school_a.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_text = str(response.data).lower()
        self.assertTrue("student_class" in error_text or "subject" in error_text)
