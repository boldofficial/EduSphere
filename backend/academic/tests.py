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
            "/api/academic/broadsheet/",
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
            f"/api/academic/reports/{self.report.id}/suggest-remark/",
            {},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("suggestion", response.data)
        self.assertEqual(response.data["data"]["attendance"]["present"], 1)


class AcademicLearnerScopeTests(APITestCase):
    def setUp(self):
        self.school = School.objects.create(name="Scope School", domain="demo-scope")
        self.student_class = Class.objects.create(name="JSS 2", school=self.school)
        self.student_user = get_user_model().objects.create_user(
            username="student@demo-scope", password="password123", role="STUDENT", school=self.school
        )
        self.parent_user = get_user_model().objects.create_user(
            username="parent@demo-scope",
            email="parent@example.com",
            password="password123",
            role="PARENT",
            school=self.school,
        )
        self.me = Student.objects.create(
            school=self.school,
            student_no="S1",
            names="Me",
            gender="Male",
            current_class=self.student_class,
            user=self.student_user,
            parent_email="parent@example.com",
        )
        self.other = Student.objects.create(
            school=self.school,
            student_no="S2",
            names="Other",
            gender="Female",
            current_class=self.student_class,
        )

    def _student_ids(self, user):
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/academic/students/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return {row["id"] for row in response.data["results"]}

    def test_student_sees_only_self(self):
        self.assertEqual(self._student_ids(self.student_user), {self.me.id})

    def test_parent_sees_only_own_children(self):
        self.assertEqual(self._student_ids(self.parent_user), {self.me.id})

    def test_student_cannot_view_broadsheet(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(
            "/api/academic/broadsheet/",
            {"class_id": self.student_class.id, "session": "2025/2026", "term": "First Term"},
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TeacherScopeTests(APITestCase):
    def setUp(self):
        from academic.models import Teacher

        self.school = School.objects.create(name="Teacher School", domain="demo-teacher-scope")
        self.teacher_user = get_user_model().objects.create_user(
            username="teacher@demo-teacher-scope", password="password123", role="TEACHER", school=self.school
        )
        teacher = Teacher.objects.create(school=self.school, user=self.teacher_user)
        self.my_class = Class.objects.create(name="JSS 1A", school=self.school, class_teacher=teacher)
        other_class = Class.objects.create(name="JSS 1B", school=self.school)
        self.mine = Student.objects.create(
            school=self.school, student_no="T1", names="Mine", gender="Male", current_class=self.my_class
        )
        Student.objects.create(
            school=self.school, student_no="T2", names="Not Mine", gender="Male", current_class=other_class
        )

    def test_teacher_sees_only_students_in_own_classes(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/academic/students/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({row["id"] for row in response.data["results"]}, {self.mine.id})


class SchoolAnalyticsTests(APITestCase):
    def setUp(self):
        from bursary.models import Expense, Payment

        self.school = School.objects.create(name="Analytics School", domain="demo-analytics")
        self.admin = get_user_model().objects.create_user(
            username="admin@demo-analytics", password="password123", role="SCHOOL_ADMIN", school=self.school
        )
        cls = Class.objects.create(name="SS 1", school=self.school)
        student = Student.objects.create(
            school=self.school, student_no="A1", names="Ana", gender="Female", current_class=cls
        )
        ReportCard.objects.create(
            school=self.school, student=student, student_class=cls, session="2025/2026", term="First Term", average=70
        )
        Payment.objects.create(
            school=self.school,
            student=student,
            amount=50000,
            method="cash",
            session="2025/2026",
            term="First Term",
            reference="AN-1",
            recorded_by="admin",
        )
        Expense.objects.create(
            school=self.school,
            title="Chalk",
            amount=2000,
            category="supplies",
            session="2025/2026",
            term="First Term",
            recorded_by="admin",
        )

    def test_summary_aggregates_in_database(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            "/api/academic/analytics/", {"session": "2025/2026"}, HTTP_X_TENANT_ID=self.school.domain
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first = response.data["financial"][0]
        self.assertEqual((first["term"], first["revenue"], first["expenses"]), ("First", 50000.0, 2000.0))
        self.assertEqual(response.data["performance"][0]["average"], 70.0)
        self.assertEqual(response.data["class_comparison"], [{"class": "SS 1", "average": 70.0, "students": 1}])
        self.assertEqual(response.data["expense_breakdown"], [{"name": "Supplies", "value": 2000.0}])
        self.assertEqual(response.data["total_students"], 1)

    def test_teacher_cannot_view_school_analytics(self):
        teacher = get_user_model().objects.create_user(
            username="t@demo-analytics", password="password123", role="TEACHER", school=self.school
        )
        self.client.force_authenticate(user=teacher)
        response = self.client.get("/api/academic/analytics/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class StudentListQueryCountTests(APITestCase):
    """The student list must not run a query per student (performance_trend used to)."""

    def setUp(self):
        self.school = School.objects.create(name="Count School", domain="demo-count")
        self.admin = get_user_model().objects.create_user(
            username="admin@demo-count", password="password123", role="SCHOOL_ADMIN", school=self.school
        )
        self.cls = Class.objects.create(name="JSS 3", school=self.school)
        self.client.force_authenticate(user=self.admin)

    def _add_students(self, n, start):
        for i in range(start, start + n):
            student = Student.objects.create(
                school=self.school, student_no=f"Q{i}", names=f"Kid {i}", gender="Male", current_class=self.cls
            )
            ReportCard.objects.create(
                school=self.school,
                student=student,
                student_class=self.cls,
                session="2025/2026",
                term="First Term",
                performance_trend="improving",
            )

    def _count_queries(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get("/api/academic/students/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return len(ctx.captured_queries), response

    def test_query_count_does_not_grow_with_students(self):
        self._add_students(3, 0)
        small, _ = self._count_queries()
        self._add_students(12, 100)
        large, response = self._count_queries()
        self.assertEqual(small, large)
        self.assertTrue(all(row["performance_trend"] == "improving" for row in response.data["results"]))


class AdminDashboardTests(APITestCase):
    def setUp(self):
        from bursary.models import Expense, Payment
        from schools.models import SchoolSettings

        self.school = School.objects.create(name="Dash School", domain="demo-dash")
        SchoolSettings.objects.update_or_create(
            school=self.school, defaults={"current_session": "2025/2026", "current_term": "First Term"}
        )
        self.admin = get_user_model().objects.create_user(
            username="admin@demo-dash", password="password123", role="SCHOOL_ADMIN", school=self.school
        )
        cls = Class.objects.create(name="JSS 1", school=self.school)
        # More students than one API page, to prove counts are not truncated.
        Student.objects.bulk_create(
            [
                Student(school=self.school, student_no=f"D{i}", names=f"Kid {i}", gender="Male", current_class=cls)
                for i in range(60)
            ]
        )
        first = Student.objects.filter(school=self.school).first()
        Payment.objects.create(
            school=self.school,
            student=first,
            amount=40000,
            method="cash",
            session="2025/2026",
            term="First Term",
            reference="DASH-1",
            recorded_by="admin",
            status="completed",
        )
        Payment.objects.create(
            school=self.school,
            student=first,
            amount=5000,
            method="transfer",
            session="2025/2026",
            term="First Term",
            reference="DASH-2",
            recorded_by="admin",
            status="pending",
        )
        Expense.objects.create(
            school=self.school,
            title="Diesel",
            amount=7000,
            category="utilities",
            session="2025/2026",
            term="First Term",
            recorded_by="admin",
        )

    def test_summary_counts_whole_school_and_term_finance(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/academic/dashboard/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["counts"]["students"], 60)
        self.assertEqual(response.data["finance"]["collected"], 40000.0)
        self.assertEqual(response.data["finance"]["expenses"], 7000.0)
        self.assertEqual(response.data["action_items"]["payments_to_verify"], 1)
        self.assertEqual(len(response.data["recent_payments"]), 2)

    def test_teacher_cannot_view_admin_dashboard(self):
        teacher = get_user_model().objects.create_user(
            username="t@demo-dash", password="password123", role="TEACHER", school=self.school
        )
        self.client.force_authenticate(user=teacher)
        response = self.client.get("/api/academic/dashboard/", HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class StudentProfileTests(APITestCase):
    def setUp(self):
        from bursary.models import FeeCategory, FeeItem, Payment, StudentFee
        from schools.models import SchoolSettings

        self.school = School.objects.create(name="Profile School", domain="demo-profile")
        SchoolSettings.objects.update_or_create(
            school=self.school, defaults={"current_session": "2025/2026", "current_term": "First Term"}
        )
        self.admin = get_user_model().objects.create_user(
            username="admin@demo-profile", password="password123", role="SCHOOL_ADMIN", school=self.school
        )
        self.cls = Class.objects.create(name="SS 1", school=self.school)
        self.subject = Subject.objects.create(name="Biology", school=self.school)
        self.student = Student.objects.create(
            school=self.school, student_no="PR1", names="Chidi Eze", gender="Male", current_class=self.cls
        )
        rival = Student.objects.create(
            school=self.school, student_no="PR2", names="Rival", gender="Male", current_class=self.cls
        )
        mine = ReportCard.objects.create(
            school=self.school,
            student=self.student,
            student_class=self.cls,
            session="2025/2026",
            term="First Term",
            average=64,
        )
        ReportCard.objects.create(
            school=self.school,
            student=rival,
            student_class=self.cls,
            session="2025/2026",
            term="First Term",
            average=80,
        )
        SubjectScore.objects.create(school=self.school, report_card=mine, subject=self.subject, total=64)
        category = FeeCategory.objects.create(school=self.school, name="Tuition", is_optional=False)
        item = FeeItem.objects.create(
            school=self.school, category=category, amount=100000, session="2025/2026", term="First Term"
        )
        StudentFee.objects.create(school=self.school, student=self.student, fee_item=item)
        Payment.objects.create(
            school=self.school,
            student=self.student,
            amount=60000,
            method="cash",
            session="2025/2026",
            term="First Term",
            reference="PRF-1",
            recorded_by="admin",
            status="completed",
        )

    def test_profile_for_current_term(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            f"/api/academic/students/{self.student.id}/profile/", HTTP_X_TENANT_ID=self.school.domain
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        data = response.data
        self.assertEqual((data["session"], data["term"]), ("2025/2026", "First Term"))
        self.assertEqual(data["academics"]["position"], 2)
        self.assertEqual(data["academics"]["class_size"], 2)
        self.assertEqual(data["academics"]["subjects"][0]["subject"], "Biology")
        self.assertEqual(data["finance"]["total_bill"], 100000.0)
        self.assertEqual(data["finance"]["balance"], 40000.0)
        self.assertIn("Parent phone is missing.", data["warnings"])

    def test_other_student_cannot_view_profile(self):
        other = get_user_model().objects.create_user(
            username="kid@demo-profile", password="password123", role="STUDENT", school=self.school
        )
        Student.objects.create(school=self.school, student_no="PR3", names="Other Kid", gender="Female", user=other)
        self.client.force_authenticate(user=other)
        response = self.client.get(
            f"/api/academic/students/{self.student.id}/profile/", HTTP_X_TENANT_ID=self.school.domain
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class StudentDeleteCascadeTests(APITestCase):
    """Deleting a student with history used to recurse forever in AuditTrailMixin (deferred fields)."""

    def test_delete_student_with_results_and_payments(self):
        from bursary.models import Payment

        school = School.objects.create(name="Delete School", domain="demo-delete")
        admin = get_user_model().objects.create_user(
            username="admin@demo-delete", password="password123", role="SCHOOL_ADMIN", school=school
        )
        cls = Class.objects.create(name="JSS 2", school=school)
        student = Student.objects.create(
            school=school, student_no="DEL1", names="Gone Soon", gender="Male", current_class=cls
        )
        report = ReportCard.objects.create(
            school=school, student=student, student_class=cls, session="2025/2026", term="First Term"
        )
        SubjectScore.objects.create(
            school=school, report_card=report, subject=Subject.objects.create(name="Art", school=school), total=70
        )
        Payment.objects.create(
            school=school,
            student=student,
            amount=1000,
            method="cash",
            session="2025/2026",
            term="First Term",
            reference="DEL-1",
            recorded_by="admin",
        )
        self.client.force_authenticate(user=admin)
        response = self.client.delete(f"/api/academic/students/{student.id}/", HTTP_X_TENANT_ID=school.domain)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(pk=student.pk).exists())
