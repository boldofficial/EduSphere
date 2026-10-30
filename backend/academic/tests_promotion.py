"""End of session: promote, repeat or graduate every student, with history and alumni."""

from django.test import TestCase
from rest_framework.test import APIClient

from academic.calendar import ensure_calendar
from academic.models import AcademicTerm, Class, ReportCard, Student, StudentHistory, SubjectTeacher, Teacher
from schools.models import School, SchoolSettings
from users.models import User

SESSION = "2025/2026"


class SessionPromotionTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Promo School", domain="promo")
        SchoolSettings.objects.create(
            school=self.school, current_session=SESSION, current_term="Third Term", promotion_threshold=50
        )
        ensure_calendar(self.school)
        self.sss3 = Class.objects.create(school=self.school, name="SSS 3", is_graduation_class=True)
        self.sss2 = Class.objects.create(school=self.school, name="SSS 2", next_class=self.sss3)
        self.sss1 = Class.objects.create(school=self.school, name="SSS 1", next_class=self.sss2)
        self.good = self.student("Good", "P1", self.sss1, [70, 60])
        self.weak = self.student("Weak", "P2", self.sss1, [40, 35])
        self.leaver = self.student("Leaver", "P3", self.sss3, [55])
        self.admin = User.objects.create_user(
            username="head@promo", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        teacher = Teacher.objects.create(school=self.school, name="Mrs Ade")
        SubjectTeacher.objects.create(
            school=self.school, teacher=teacher, student_class=self.sss1, subject="Physics", session=SESSION
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.client.credentials(HTTP_X_TENANT_ID=self.school.domain)

    def student(self, name, number, cls, averages):
        student = Student.objects.create(
            school=self.school, names=name, student_no=number, gender="Female", current_class=cls
        )
        for term, average in zip(["First Term", "Second Term", "Third Term"], averages):
            ReportCard.objects.create(
                school=self.school, student=student, student_class=cls, session=SESSION, term=term, average=average
            )
        return student

    def test_plan_suggests_from_the_pass_mark_and_class_links(self):
        data = self.client.get("/api/academic/calendar/promotion/").data
        self.assertEqual(data["next_session"], "2026/2027")
        rows = {s["names"]: s for c in data["classes"] for s in c["students"]}
        self.assertEqual(rows["Good"]["suggestion"], "promote")
        self.assertEqual(rows["Good"]["average"], 65.0)
        self.assertEqual(rows["Weak"]["suggestion"], "repeat")
        self.assertEqual(rows["Leaver"]["suggestion"], "graduate")
        self.assertEqual(data["pending"], 3)
        sss1 = next(c for c in data["classes"] if c["name"] == "SSS 1")
        self.assertEqual(sss1["next_class"]["name"], "SSS 2")

    def test_apply_moves_students_records_history_and_graduates(self):
        response = self.client.post(
            "/api/academic/calendar/promotion/",
            {
                "session": SESSION,
                "decisions": {
                    str(self.good.pk): "promote",
                    str(self.weak.pk): "repeat",
                    str(self.leaver.pk): "graduate",
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual((response.data["promoted"], response.data["repeated"], response.data["graduated"]), (1, 1, 1))
        self.assertEqual(response.data["subject_teachers_copied"], 1)
        for s in (self.good, self.weak, self.leaver):
            s.refresh_from_db()
        self.assertEqual(self.good.current_class, self.sss2)
        self.assertEqual(self.weak.current_class, self.sss1)
        self.assertEqual((self.leaver.status, self.leaver.current_class), ("graduated", None))
        history = StudentHistory.objects.get(student=self.leaver)
        self.assertEqual(
            (history.event_type, history.student_class, history.session), ("graduation", self.sss3, SESSION)
        )
        self.assertTrue(SubjectTeacher.objects.filter(session="2026/2027", subject="Physics").exists())

        # Applying again does not promote anyone twice.
        again = self.client.post(
            "/api/academic/calendar/promotion/",
            {"session": SESSION, "decisions": {str(self.good.pk): "promote"}},
            format="json",
        )
        self.assertEqual(again.data["skipped"], 1)
        self.good.refresh_from_db()
        self.assertEqual(self.good.current_class, self.sss2)
        self.assertEqual(self.client.get("/api/academic/calendar/promotion/").data["pending"], 0)

    def test_class_without_next_class_cannot_promote(self):
        orphan = Class.objects.create(school=self.school, name="Remedial")
        stuck = self.student("Stuck", "P9", orphan, [80])
        response = self.client.post(
            "/api/academic/calendar/promotion/",
            {"session": SESSION, "decisions": {str(stuck.pk): "promote"}},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Remedial has no next class", response.data["detail"])

    def test_closing_third_term_asks_for_promotions_first(self):
        self.client.post("/api/academic/calendar/", {}, format="json")  # 2026/2027
        third = AcademicTerm.objects.get(school=self.school, session=SESSION, name="Third Term")
        checks = self.client.get(f"/api/academic/calendar/terms/{third.pk}/checklist/").data["checks"]
        self.assertEqual(checks[0]["key"], "promotion")
        self.assertIn("3 students not yet promoted", checks[0]["summary"])
