"""
Tests for Learning Module - Exams, Questions, Quizzes
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from academic.models import Class, Student, Subject, Teacher
from schools.models import School

from .models import (
    Assignment, BankQuestion, Exam, ExamPaper, ExamQuestion,
    Question, QuestionBank, Quiz, Submission
)


class QuestionBankAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-qb")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-qb",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        self.subject = Subject.objects.create(school=self.school, name="Mathematics")

    def test_create_question_bank(self):
        response = self.client.post(
            "/api/learning/question-banks/",
            {"name": "Math Quiz Bank", "description": "Basic math questions", "subject": self.subject.id},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Math Quiz Bank")

    def test_list_question_banks(self):
        QuestionBank.objects.create(school=self.school, name="Test Bank", subject=self.subject)
        response = self.client.get("/api/learning/question-banks/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ExamAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-exams")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-exams",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        self.student_class = Class.objects.create(school=self.school, name="JSS 1")
        self.subject = Subject.objects.create(school=self.school, name="Mathematics")

    def test_create_exam(self):
        response = self.client.post(
            "/api/learning/exams/",
            {
                "title": "First Term Exam",
                "description": "Mathematics first term",
                "exam_class": self.student_class.id,
                "subject": self.subject.id,
                "session": "2025/2026",
                "term": "First Term",
                "duration_minutes": 60,
                "pass_mark": 50,
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "First Term Exam")

    def test_list_exams(self):
        Exam.objects.create(
            school=self.school,
            title="Test Exam",
            exam_class=self.student_class,
            subject=self.subject,
            session="2025/2026",
            term="First Term",
        )
        response = self.client.get("/api/learning/exams/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class QuizAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-quiz")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-quiz",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        self.student_class = Class.objects.create(school=self.school, name="JSS 1")
        self.subject = Subject.objects.create(school=self.school, name="Mathematics")

    def test_create_quiz(self):
        response = self.client.post(
            "/api/learning/quizzes/",
            {
                "title": "Daily Quiz",
                "description": "Quick math quiz",
                "student_class": self.student_class.id,
                "subject": self.subject.id,
                "session": "2025/2026",
                "term": "First Term",
                "time_limit": 15,
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class AssignmentAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", domain="test-assign")
        self.admin = get_user_model().objects.create_user(
            username="admin@test-assign",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)
        self.student_class = Class.objects.create(school=self.school, name="JSS 1")
        self.subject = Subject.objects.create(school=self.school, name="Mathematics")

    def test_create_assignment(self):
        response = self.client.post(
            "/api/learning/assignments/",
            {
                "title": "Homework 1",
                "description": "Complete exercises 1-10",
                "student_class": self.student_class.id,
                "subject": self.subject.id,
                "due_date": "2025-02-01",
            },
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Homework 1")


class TenantIsolationTests(APITestCase):
    """Test that tenant isolation works correctly for learning module"""

    def setUp(self):
        self.client = APIClient()
        self.school_a = School.objects.create(name="School A", domain="school-a-learn")
        self.school_b = School.objects.create(name="School B", domain="school-b-learn")
        
        self.admin_a = get_user_model().objects.create_user(
            username="admin-a-learn",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_a,
        )
        self.admin_b = get_user_model().objects.create_user(
            username="admin-b-learn",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_b,
        )
        
        self.subject_a = Subject.objects.create(school=self.school_a, name="Math A")
        self.subject_b = Subject.objects.create(school=self.school_b, name="Math B")

    def test_school_a_cannot_see_school_b_question_banks(self):
        """School A admin should not see School B's question banks"""
        bank_b = QuestionBank.objects.create(school=self.school_b, name="School B Bank", subject=self.subject_b)
        
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get("/api/learning/question-banks/", HTTP_X_TENANT_ID=self.school_a.domain)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bank_ids = [b["id"] for b in response.data.get("results", [])]
        self.assertNotIn(bank_b.id, bank_ids)

    def test_cross_tenant_exam_isolation(self):
        """Exams should be isolated by tenant"""
        class_a = Class.objects.create(school=self.school_a, name="Class A")
        exam_a = Exam.objects.create(
            school=self.school_a,
            title="Exam A",
            exam_class=class_a,
            subject=self.subject_a,
            session="2025/2026",
            term="First Term",
        )
        
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.get(f"/api/learning/exams/{exam_a.id}/", HTTP_X_TENANT_ID=self.school_a.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # School B admin should not see School A's exam
        self.client.force_authenticate(user=self.admin_b)
        response = self.client.get(f"/api/learning/exams/{exam_a.id}/", HTTP_X_TENANT_ID=self.school_b.domain)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)