from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import (
    AttendanceRecord,
    AttendanceSession,
    Class,
    ConductEntry,
    ReportCard,
    Student,
    Subject,
    SubjectScore,
)
from schools.models import School


class AcademicRegressionTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Demo School", domain="demo-academic")
        self.admin = get_user_model().objects.create_user(
            username="admin@demo-academic",
            password="password123",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client.force_authenticate(user=self.admin)

        self.student_class = Class.objects.create(name="JSS 1", school=self.school)
        self.student = Student.objects.create(
            school=self.school,
            student_no="ST001",
            names="John Doe",
            gender="Male",
            current_class=self.student_class,
        )
        self.subject = Subject.objects.create(name="Mathematics", school=self.school)
        self.report = ReportCard.objects.create(
            school=self.school,
            student=self.student,
            student_class=self.student_class,
            session="2025/2026",
            term="First Term",
        )
        SubjectScore.objects.create(
            school=self.school,
            report_card=self.report,
            subject=self.subject,
            ca1=15,
            ca2=20,
            exam=55,
        )

    def test_broadsheet_uses_report_card_scores_fields(self):
        response = self.client.get(
            "/api/broadsheet/",
            {
                "class_id": self.student_class.id,
                "session": "2025/2026",
                "term": "First Term",
            },
            HTTP_X_TENANT_ID=self.school.domain,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["students"]), 1)

        student_row = response.data["students"][0]
        math_row = student_row["subjects"]["Mathematics"]
        self.assertEqual(math_row["ca"], 35.0)
        self.assertEqual(math_row["exam"], 55.0)
        self.assertEqual(math_row["total"], 90.0)

    def test_suggest_remark_uses_attendance_session_and_conduct_model(self):
        AttendanceSession.objects.create(
            school=self.school,
            student_class=self.student_class,
            date=timezone.now().date(),
            session="2025/2026",
            term="First Term",
        )
        attendance_session = AttendanceSession.objects.get(school=self.school)
        AttendanceRecord.objects.create(
            school=self.school,
            attendance_session=attendance_session,
            student=self.student,
            status="present",
        )
        ConductEntry.objects.create(
            school=self.school,
            student=self.student,
            trait="Punctuality",
            score=4,
            remark="Improving",
            recorded_by=self.admin,
        )

        response = self.client.post(
            f"/api/reports/{self.report.id}/suggest-remark/",
            {},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("suggestion", response.data)
        self.assertEqual(response.data["data"]["attendance"]["present"], 1)
