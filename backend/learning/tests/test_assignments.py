from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Class, Student, Subject, Teacher
from learning.models import Assignment, Submission
from schools.models import School

User = get_user_model()

class AssignmentTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Learning School", domain="learning")
        self.class_a = Class.objects.create(name="Class A", school=self.school)
        self.subject = Subject.objects.create(name="Math", school=self.school)
        self.teacher = Teacher.objects.create(name="Mr. Math", school=self.school)
        
        self.student_user = User.objects.create_user(
            username="student_user", password="password123", role="STUDENT", school=self.school
        )
        self.student_profile = Student.objects.create(
            school=self.school,
            user=self.student_user,
            student_no="ST001",
            names="Alice",
            current_class=self.class_a
        )

        self.assignment = Assignment.objects.create(
            school=self.school,
            title="Algebra HW",
            description="Solve for X",
            student_class=self.class_a,
            subject=self.subject,
            teacher=self.teacher,
            due_date="2026-12-31T23:59:59Z",
            points=10
        )

    def test_student_can_submit_assignment(self):
        """Verify that a student can submit their assignment via the API."""
        self.client.force_authenticate(user=self.student_user)
        
        data = {
            "assignment": self.assignment.id,
            "student": self.student_profile.id,
            "submission_text": "X = 5"
        }
        
        # Note: SubmissionViewSet is standard ModelViewSet
        response = self.client.post("/api/learning/submissions/", data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Submission.objects.filter(assignment=self.assignment, student=self.student_profile).exists())

    def test_duplicate_submission_constraint(self):
        """Ensure the unique_together constraint on (assignment, student) is respected."""
        Submission.objects.create(
            school=self.school,
            assignment=self.assignment,
            student=self.student_profile,
            submission_text="First try"
        )
        
        self.client.force_authenticate(user=self.student_user)
        data = {
            "assignment": self.assignment.id,
            "student": self.student_profile.id,
            "submission_text": "Second try"
        }
        
        response = self.client.post("/api/learning/submissions/", data, format='json')
        # DRF should return 400 for unique constraint violation in serializers
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
