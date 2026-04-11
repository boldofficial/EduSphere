from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Class, Student, Subject, Teacher
from learning.models import Attempt, Option, Question, Quiz, StudentAnswer
from schools.models import School

User = get_user_model()

class QuizLogicTests(APITestCase):
    def setUp(self):
        # Setup Schools
        self.school_a = School.objects.create(name="School A", domain="school-a")
        self.school_b = School.objects.create(name="School B", domain="school-b")

        # Setup Class and Subject
        self.class_a = Class.objects.create(name="JSS 1", school=self.school_a)
        self.subject_a = Subject.objects.create(name="History", school=self.school_a)

        # Setup Teacher
        self.teacher_a = Teacher.objects.create(school=self.school_a, name="Mr. History")

        # Setup Student A (School A)
        self.student_user_a = User.objects.create_user(
            username="student_a", password="password123", role="STUDENT", school=self.school_a
        )
        self.student_profile_a = Student.objects.create(
            school=self.school_a, user=self.student_user_a, student_no="ST001", names="Alice", current_class=self.class_a
        )

        # Setup Student B (School B)
        self.student_user_b = User.objects.create_user(
            username="student_b", password="password123", role="STUDENT", school=self.school_b
        )
        self.student_profile_b = Student.objects.create(
            school=self.school_b, user=self.student_user_b, student_no="ST002", names="Bob"
        )

        # Setup Quiz
        self.quiz = Quiz.objects.create(
            school=self.school_a,
            title="World War I",
            student_class=self.class_a,
            subject=self.subject_a,
            teacher=self.teacher_a,
            start_time=timezone.now(),
            end_time=timezone.now() + timezone.timedelta(hours=2),
            is_published=True
        )

        # Setup MCQ Question
        self.q1 = Question.objects.create(
            school=self.school_a, quiz=self.quiz, text="When did WWI start?", question_type="mcq", points=5
        )
        self.opt_correct = Option.objects.create(school=self.school_a, question=self.q1, text="1914", is_correct=True)
        self.opt_wrong = Option.objects.create(school=self.school_a, question=self.q1, text="1939", is_correct=False)

    def test_student_can_submit_quiz_and_get_score(self):
        """Verify that a student can take a quiz and the system calculates points correctly."""
        self.client.force_authenticate(user=self.student_user_a)
        
        data = {
            "answers": [
                {
                    "question_id": self.q1.id,
                    "selected_option_id": self.opt_correct.id
                }
            ]
        }
        
        response = self.client.post(f"/api/learning/quizzes/{self.quiz.id}/submit/", data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["score"], 5)
        
        # Verify attempt record
        attempt = Attempt.objects.get(quiz=self.quiz, student=self.student_profile_a)
        self.assertEqual(attempt.total_score, 5.0)
        self.assertEqual(StudentAnswer.objects.filter(attempt=attempt).count(), 1)

    def test_student_gets_zero_for_wrong_answers(self):
        """Verify that wrong answers result in 0 score."""
        self.client.force_authenticate(user=self.student_user_a)
        
        data = {
            "answers": [
                {
                    "question_id": self.q1.id,
                    "selected_option_id": self.opt_wrong.id
                }
            ]
        }
        
        response = self.client.post(f"/api/learning/quizzes/{self.quiz.id}/submit/", data, format='json')
        self.assertEqual(response.data["score"], 0)

    def test_cross_tenant_submission_is_blocked(self):
        """Security check: Student from School B cannot take Quiz in School A."""
        self.client.force_authenticate(user=self.student_user_b)
        
        data = {"answers": []}
        response = self.client.post(f"/api/learning/quizzes/{self.quiz.id}/submit/", data, format='json')
        
        # Note: TenantViewSet filters queryset by school, so non-owned quizes return 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_duplicate_submission_is_prevented(self):
        """A student should only be able to submit a quiz once."""
        self.client.force_authenticate(user=self.student_user_a)
        
        data = {"answers": [{"question_id": self.q1.id, "selected_option_id": self.opt_correct.id}]}
        
        # First submission
        self.client.post(f"/api/learning/quizzes/{self.quiz.id}/submit/", data, format='json')
        
        # Second submission
        response = self.client.post(f"/api/learning/quizzes/{self.quiz.id}/submit/", data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already submitted", str(response.data))
