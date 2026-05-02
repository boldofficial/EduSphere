from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from academic.models import Student
from schools.models import School


class MessagingApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Messaging School", domain="messaging-school")
        self.other_school = School.objects.create(name="Other School", domain="other-messaging-school")

        User = get_user_model()
        self.admin = User.objects.create_user(
            username="admin@messaging.test",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.student_user = User.objects.create_user(
            username="STU001@messaging-school",
            password="password123",
            role="STUDENT",
            school=self.school,
        )
        self.teacher_user = User.objects.create_user(
            username="teacher@messaging.test",
            password="password123",
            role="TEACHER",
            school=self.school,
        )
        self.foreign_user = User.objects.create_user(
            username="foreign@other.test",
            password="password123",
            role="TEACHER",
            school=self.other_school,
        )

        Student.objects.create(
            school=self.school,
            user=self.student_user,
            student_no="ADM-001",
            names="John Student",
            gender="Male",
            parent_name="Parent One",
        )

    def test_recipients_endpoint_shows_student_full_name(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            "/api/core/conversations/recipients/",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.json()

        student_row = next((r for r in rows if r.get("user_id") == self.student_user.id), None)
        self.assertIsNotNone(student_row)
        self.assertEqual(student_row["name"], "John Student")
        self.assertEqual(student_row["type"], "student")

    def test_start_endpoint_creates_conversation_and_first_message_atomically(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "participant_id": self.teacher_user.id,
            "subject": "Welcome",
            "body": "Hello teacher",
            "type": "DIRECT",
        }
        response = self.client.post(
            "/api/core/conversations/start/",
            payload,
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("conversation", data)
        self.assertIn("message", data)
        self.assertEqual(data["message"]["body"], "Hello teacher")

    def test_start_endpoint_blocks_cross_tenant_recipient(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "participant_id": self.foreign_user.id,
            "subject": "Cross tenant",
            "body": "Should not send",
            "type": "DIRECT",
        }
        response = self.client.post(
            "/api/core/conversations/start/",
            payload,
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

