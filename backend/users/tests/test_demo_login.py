from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class DemoLoginTests(APITestCase):
    def setUp(self):
        from academic.models import Student
        from schools.models import School

        self.school = School.objects.create(name="Demo", domain="demo")
        User = get_user_model()
        # Configured account exists but has no student record (the production demo's state)
        User.objects.create_user(username="ST001@demo", password="x", role="STUDENT", school=self.school)
        self.real = User.objects.create_user(username="kid@demo", password="x", role="STUDENT", school=self.school)
        Student.objects.create(school=self.school, student_no="D1", names="Demo Kid", gender="Male", user=self.real)

    def test_student_demo_login_uses_an_account_with_a_student_record(self):
        from unittest import mock

        with mock.patch.dict("os.environ", {"ENABLE_DEMO_LOGIN": "true"}):
            response = self.client.post("/api/users/demo-login/", {"role": "student"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["user"]["username"], "kid@demo")

    def test_demo_login_disabled_by_default(self):
        from unittest import mock

        with mock.patch.dict("os.environ", {"ENABLE_DEMO_LOGIN": ""}):
            response = self.client.post("/api/users/demo-login/", {"role": "admin"}, format="json")
        self.assertEqual(response.status_code, 403)
