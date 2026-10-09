"""Regression tests for the role-permission fixes (staff data, HR, CBT, inventory)."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Class, Student, Subject, Teacher
from learning.models import Attempt, Option, Question, Quiz
from schools.models import School


class RoleSecurityTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.school = School.objects.create(name="Secure School", domain="secure-school")
        self.domain = self.school.domain
        self.cls = Class.objects.create(name="SS 2", school=self.school)
        self.subject = Subject.objects.create(name="Physics", school=self.school)

        self.admin = User.objects.create_user(
            username="admin@secure", password="pw-123456", role="SCHOOL_ADMIN", school=self.school
        )
        self.teacher_user = User.objects.create_user(
            username="teacher@secure", password="pw-123456", role="TEACHER", school=self.school
        )
        self.teacher = Teacher.objects.create(
            school=self.school,
            user=self.teacher_user,
            name="Mrs Ada",
            basic_salary=250000,
            bank_name="Demo Bank",
            account_number="0123456789",
            phone="08000000000",
        )
        self.student_user = User.objects.create_user(
            username="student@secure", password="pw-123456", role="STUDENT", school=self.school
        )
        self.student = Student.objects.create(
            school=self.school,
            student_no="S-1",
            names="Bola",
            gender="Female",
            current_class=self.cls,
            user=self.student_user,
        )

        now = timezone.now()
        self.quiz = Quiz.objects.create(
            school=self.school,
            title="Motion",
            student_class=self.cls,
            subject=self.subject,
            duration_minutes=30,
            start_time=now - timedelta(minutes=5),
            end_time=now + timedelta(hours=1),
            is_published=True,
        )
        self.question = Question.objects.create(school=self.school, quiz=self.quiz, text="g = ?", points=5)
        self.right = Option.objects.create(school=self.school, question=self.question, text="9.8", is_correct=True)
        Option.objects.create(school=self.school, question=self.question, text="1.0", is_correct=False)
        self.draft_quiz = Quiz.objects.create(
            school=self.school,
            title="Draft",
            student_class=self.cls,
            subject=self.subject,
            start_time=now,
            end_time=now + timedelta(hours=1),
            is_published=False,
        )

    def _as(self, user):
        self.client.force_authenticate(user=user)

    def _get(self, url, **params):
        return self.client.get(url, params, HTTP_X_TENANT_ID=self.domain)

    # --- Staff directory -------------------------------------------------------------------
    def test_student_sees_staff_directory_without_pay_or_bank(self):
        self._as(self.student_user)
        rows = self._get("/api/academic/teachers/").data["results"]
        self.assertEqual(rows[0]["name"], "Mrs Ada")
        for field in ("basic_salary", "account_number", "bank_name", "phone", "tax_id", "pfa_number"):
            self.assertNotIn(field, rows[0])

    def test_admin_still_sees_full_staff_record(self):
        self._as(self.admin)
        row = self._get("/api/academic/teachers/").data["results"][0]
        self.assertEqual(row["account_number"], "0123456789")

    def test_teacher_cannot_edit_staff_records(self):
        self._as(self.teacher_user)
        response = self.client.patch(
            f"/api/academic/teachers/{self.teacher.id}/",
            {"basic_salary": 999999},
            format="json",
            HTTP_X_TENANT_ID=self.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- HR & payroll ----------------------------------------------------------------------
    def test_hr_is_admin_only(self):
        for user in (self.student_user, self.teacher_user):
            self._as(user)
            for url in ("/api/hr/payrolls/", "/api/hr/salary-structures/", "/api/hr/dashboard/"):
                self.assertEqual(self._get(url).status_code, status.HTTP_403_FORBIDDEN, (user.role, url))
        self._as(self.admin)
        self.assertEqual(self._get("/api/hr/payrolls/").status_code, status.HTTP_200_OK)

    # --- Inventory -------------------------------------------------------------------------
    def test_students_cannot_read_inventory_and_teachers_cannot_write(self):
        self._as(self.student_user)
        self.assertEqual(self._get("/api/inventory/items/").status_code, status.HTTP_403_FORBIDDEN)
        self._as(self.teacher_user)
        self.assertEqual(self._get("/api/inventory/items/").status_code, status.HTTP_200_OK)
        response = self.client.post(
            "/api/inventory/items/", {"name": "Chalk"}, format="json", HTTP_X_TENANT_ID=self.domain
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- CBT -------------------------------------------------------------------------------
    def test_student_quiz_view_hides_answer_key_and_drafts(self):
        self._as(self.student_user)
        quizzes = self._get("/api/learning/quizzes/").data["results"]
        self.assertEqual([q["title"] for q in quizzes], ["Motion"])
        options = quizzes[0]["questions"][0]["options"]
        self.assertTrue(options)
        self.assertTrue(all("is_correct" not in o for o in options))

        questions = self._get("/api/learning/questions/", quiz_id=self.quiz.id).data["results"]
        self.assertTrue(all("is_correct" not in o for q in questions for o in q["options"]))

    def test_teacher_still_sees_answer_key(self):
        self._as(self.teacher_user)
        quizzes = self._get("/api/learning/quizzes/").data["results"]
        motion = next(q for q in quizzes if q["title"] == "Motion")
        self.assertIn("is_correct", motion["questions"][0]["options"][0])

    def test_student_cannot_create_quiz_or_edit_attempt_score(self):
        self._as(self.student_user)
        response = self.client.post(
            "/api/learning/quizzes/",
            {"title": "Mine", "student_class": self.cls.id, "subject": self.subject.id},
            format="json",
            HTTP_X_TENANT_ID=self.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        attempt = Attempt.objects.create(
            school=self.school, quiz=self.quiz, student=self.student, start_time=timezone.now()
        )
        response = self.client.patch(
            f"/api/learning/attempts/{attempt.id}/",
            {"total_score": 100},
            format="json",
            HTTP_X_TENANT_ID=self.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_submit_scores_each_question_once(self):
        self._as(self.student_user)
        answers = [{"question_id": self.question.id, "selected_option_id": self.right.id}] * 3
        response = self.client.post(
            f"/api/learning/quizzes/{self.quiz.id}/submit/",
            {"answers": answers},
            format="json",
            HTTP_X_TENANT_ID=self.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["score"], 5)
        self.assertFalse(response.data["late"])

    def test_cannot_submit_unpublished_quiz(self):
        self._as(self.student_user)
        response = self.client.post(
            f"/api/learning/quizzes/{self.draft_quiz.id}/submit/",
            {"answers": []},
            format="json",
            HTTP_X_TENANT_ID=self.domain,
        )
        # Drafts are invisible to students, so the quiz is not found at all.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
