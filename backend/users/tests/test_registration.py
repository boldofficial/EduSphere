from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import Teacher
from schools.models import School

User = get_user_model()

class RegistrationTests(APITestCase):
    def setUp(self):
        # Create Schools
        self.school_a = School.objects.create(name="School A", domain="school-a")
        self.school_b = School.objects.create(name="School B", domain="school-b")

        # Create Admins
        self.admin_a = User.objects.create_user(
            username="admin@school-a.com",
            email="admin@school-a.com",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_a
        )
        self.admin_b = User.objects.create_user(
            username="admin@school-b.com",
            email="admin@school-b.com",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school_b
        )

        # Create teacher profiles (not yet linked to users)
        self.teacher_profile_a = Teacher.objects.create(
            school=self.school_a,
            name="Teacher A",
            email="teacher@school-a.com",
            staff_type="ACADEMIC"
        )
        self.teacher_profile_b = Teacher.objects.create(
            school=self.school_b,
            name="Teacher B",
            email="teacher@school-b.com",
            staff_type="ACADEMIC"
        )

    def test_school_admin_can_create_account_for_own_staff(self):
        """Verify that a school admin can successfully setup an account for their own teacher."""
        self.client.force_authenticate(user=self.admin_a)
        
        data = {
            "profileId": self.teacher_profile_a.id,
            "profileType": "teacher",
            "email": "teacher@school-a.com",
            "password": "newpassword123",
            "name": "Teacher A"
        }
        
        response = self.client.post("/api/users/account-setup/", data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.filter(email="teacher@school-a.com").exists())
        
        # Verify linkage
        self.teacher_profile_a.refresh_from_db()
        self.assertIsNotNone(self.teacher_profile_a.user)
        self.assertEqual(self.teacher_profile_a.user.email, "teacher@school-a.com")

    def test_school_admin_cannot_create_account_for_other_school_staff(self):
        """Verify cross-tenant security: Admin A cannot setup account for Teacher B."""
        self.client.force_authenticate(user=self.admin_a)
        
        data = {
            "profileId": self.teacher_profile_b.id,
            "profileType": "teacher",
            "email": "teacher@school-b.com",
            "password": "newpassword123"
        }
        
        response = self.client.post("/api/users/account-setup/", data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(email="teacher@school-b.com").exists())

    def test_regular_teacher_cannot_access_account_setup(self):
        """Only admins should access the setup endpoint."""
        # Create a teacher user
        teacher_user = User.objects.create_user(
            username="some-teacher@school-a.com",
            password="password123",
            role="TEACHER",
            school=self.school_a
        )
        self.client.force_authenticate(user=teacher_user)
        
        data = {
            "profileId": self.teacher_profile_a.id,
            "profileType": "teacher",
            "email": "another@school-a.com",
            "password": "password123"
        }
        
        response = self.client.post("/api/users/account-setup/", data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_email_across_schools_is_blocked(self):
        """Ensure a user email cannot be reused in a different school."""
        # First, create a user in School B
        User.objects.create_user(
            username="shared@email.com",
            email="shared@email.com",
            password="password123",
            school=self.school_b,
            role="TEACHER"
        )
        
        # Now try to setup account for a teacher in School A with the same email
        self.client.force_authenticate(user=self.admin_a)
        data = {
            "profileId": self.teacher_profile_a.id,
            "profileType": "teacher",
            "email": "shared@email.com",
            "password": "password123"
        }
        
        response = self.client.post("/api/users/account-setup/", data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already belongs to another school", str(response.data))
