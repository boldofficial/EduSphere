from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Teacher, Student, Class
from schools.models import School

User = get_user_model()

class ProfileTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Profile School", domain="profile")
        
        # Super Admin
        self.super_admin = User.objects.create_superuser(
            username="super@registra.net",
            email="super@registra.net",
            password="password123",
            role="SUPER_ADMIN"
        )
        
        # School Admin
        self.school_admin = User.objects.create_user(
            username="admin@profile.com",
            email="admin@profile.com",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school
        )
        
        # Teacher User and Profile
        self.teacher_user = User.objects.create_user(
            username="teacher@profile.com",
            email="teacher@profile.com",
            password="password123",
            role="TEACHER",
            school=self.school
        )
        self.teacher_profile = Teacher.objects.create(
            school=self.school,
            user=self.teacher_user,
            name="Main Teacher",
            staff_type="ACADEMIC"
        )

        # Student User and Profile
        self.student_class = Class.objects.create(name="JSS 1", school=self.school)
        self.student_user = User.objects.create_user(
            username="ST001",
            password="password123",
            role="STUDENT",
            school=self.school
        )
        self.student_profile = Student.objects.create(
            school=self.school,
            user=self.student_user,
            student_no="ST001",
            names="John Student",
            current_class=self.student_class
        )

    def test_me_endpoint_returns_teacher_profile(self):
        """Verify that /api/users/me/ returns teacher profile ID."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/users/me/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "TEACHER")
        self.assertEqual(response.data["profile_id"], self.teacher_profile.id)

    def test_me_endpoint_returns_student_profile(self):
        """Verify that /api/users/me/ returns student profile ID."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get("/api/users/me/")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "STUDENT")
        self.assertEqual(response.data["profile_id"], self.student_profile.id)

    def test_super_admin_can_impersonate(self):
        """Super Admin should be able to get tokens for a target user."""
        self.client.force_authenticate(user=self.super_admin)
        
        data = {"user_id": self.teacher_user.id}
        response = self.client.post("/api/users/impersonate/", data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.teacher_user.email)

    def test_school_admin_cannot_impersonate(self):
        """Security check: School Admin should NOT be able to impersonate."""
        self.client.force_authenticate(user=self.school_admin)
        
        data = {"user_id": self.teacher_user.id}
        response = self.client.post("/api/users/impersonate/", data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
