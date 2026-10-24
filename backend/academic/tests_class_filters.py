"""Score screens load one class at a time: the class filter must return that class only."""

from django.test import TestCase
from rest_framework.test import APIClient

from academic.models import Class, ReportCard, Student
from schools.models import School
from users.models import User


class ClassFilterTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Filter School", domain="filters")
        self.a = Class.objects.create(school=self.school, name="JSS 1")
        self.b = Class.objects.create(school=self.school, name="JSS 2")
        for cls, name in ((self.a, "Ada"), (self.b, "Bola")):
            student = Student.objects.create(
                school=self.school, names=name, student_no=name, gender="Female", current_class=cls
            )
            ReportCard.objects.create(
                school=self.school, student=student, student_class=cls, session="2025/2026", term="First Term"
            )
        admin = User.objects.create_user(
            username="head@filters", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = APIClient()
        self.client.force_authenticate(admin)
        self.client.credentials(HTTP_X_TENANT_ID=self.school.domain)

    def rows(self, url, **params):
        data = self.client.get(url, params).data
        return data.get("results", data) if isinstance(data, dict) else data

    def test_students_and_report_cards_by_class(self):
        students = self.rows("/api/academic/students/", **{"class": self.a.pk})
        self.assertEqual([s["names"] for s in students], ["Ada"])
        cards = self.rows("/api/academic/reports/", include_all_periods="true", **{"class": self.b.pk})
        self.assertEqual(len(cards), 1)
        self.assertEqual(str(cards[0]["class_id"]), str(self.b.pk))
