"""Closing a term: the checklist, closed terms locked for teachers, and the bursar's new-term setup."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from academic.calendar import ensure_calendar, start_term
from academic.models import AcademicTerm, Class, ReportCard, Student, Subject, SubjectScore, Teacher
from bursary.balances import term_balances
from bursary.models import FeeCategory, FeeItem, Payment
from schools.models import School, SchoolSettings
from users.models import User

FIRST, SECOND = "First Term", "Second Term"
SESSION = "2025/2026"


class TermCloseTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Close School", domain="close")
        SchoolSettings.objects.create(school=self.school, current_session=SESSION, current_term=FIRST)
        ensure_calendar(self.school)
        self.jss1 = Class.objects.create(school=self.school, name="JSS 1")
        self.maths = Subject.objects.create(school=self.school, name="Mathematics")
        self.english = Subject.objects.create(school=self.school, name="English")
        self.jss1.subjects.set([self.maths, self.english])
        self.ada = Student.objects.create(
            school=self.school, names="Ada", student_no="C1", gender="Female", current_class=self.jss1
        )
        self.bola = Student.objects.create(
            school=self.school, names="Bola", student_no="C2", gender="Male", current_class=self.jss1
        )
        self.admin = User.objects.create_user(
            username="head@close", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.bursar = User.objects.create_user(
            username="bursar@close", password="Strong-Pass!2026", role="STAFF", school=self.school
        )
        self.teacher_user = User.objects.create_user(
            username="teacher@close", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        teacher = Teacher.objects.create(school=self.school, name="Mr Obi", user=self.teacher_user)
        self.jss1.class_teacher = teacher
        self.jss1.save()

        tuition = FeeCategory.objects.create(school=self.school, name="Tuition")
        self.bus = FeeCategory.objects.create(school=self.school, name="School bus", is_optional=True)
        FeeItem.objects.create(
            school=self.school, category=tuition, amount=50000, session=SESSION, term=FIRST, target_class=self.jss1
        )
        self.bus_fee = FeeItem.objects.create(
            school=self.school, category=self.bus, amount=10000, session=SESSION, term=FIRST
        )
        self.ada.assigned_fees = [str(self.bus_fee.pk)]
        self.ada.save()
        Payment.objects.create(
            school=self.school, student=self.ada, amount=20000, reference="R1", session=SESSION, term=FIRST
        )
        Payment.objects.create(
            school=self.school, student=self.bola, amount=50000, reference="R2", session=SESSION, term=FIRST
        )

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        client.credentials(HTTP_X_TENANT_ID=self.school.domain)
        return client

    def term(self, name, session=SESSION):
        return AcademicTerm.objects.get(school=self.school, session=session, name=name)

    def test_checklist_shows_what_is_missing(self):
        card = ReportCard.objects.create(
            school=self.school, student=self.ada, student_class=self.jss1, session=SESSION, term=FIRST, is_passed=True
        )
        SubjectScore.objects.create(school=self.school, report_card=card, subject=self.maths, total=70)
        data = self.client_for(self.admin).get(f"/api/academic/calendar/terms/{self.term(FIRST).pk}/checklist/").data
        checks = {c["key"]: c for c in data["checks"]}
        # Ada lacks English; Bola lacks both.
        self.assertEqual(checks["scores"]["status"], "warn")
        self.assertEqual(checks["scores"]["items"][0]["missing"], 3)
        self.assertEqual(checks["reports"]["items"][0]["missing"], 1)
        self.assertIn("1 student owes ₦40,000.00", checks["fees"]["summary"])
        self.assertEqual(checks["next_term"]["status"], "warn")
        self.assertFalse(data["ready"])
        self.assertEqual(data["next"]["term"], SECOND)
        teacher = self.client_for(self.teacher_user)
        self.assertEqual(teacher.get(f"/api/academic/calendar/terms/{self.term(FIRST).pk}/checklist/").status_code, 403)

    def test_closed_term_is_read_only_for_teachers(self):
        card = ReportCard.objects.create(
            school=self.school, student=self.ada, student_class=self.jss1, session=SESSION, term=FIRST
        )
        score = SubjectScore.objects.create(school=self.school, report_card=card, subject=self.maths, total=50)
        teacher = self.client_for(self.teacher_user)
        self.assertEqual(
            teacher.patch(f"/api/academic/scores/{score.pk}/", {"exam": 40}, format="json").status_code, 200
        )

        start_term(self.term(SECOND), self.admin)
        locked = teacher.patch(f"/api/academic/scores/{score.pk}/", {"exam": 45}, format="json")
        self.assertEqual(locked.status_code, 403)
        self.assertIn("has been closed", str(locked.data))
        attendance = teacher.post(
            "/api/academic/attendance-sessions/",
            {"date": "2025-12-01", "class_id": self.jss1.pk, "session": SESSION, "term": FIRST, "records": []},
            format="json",
        )
        self.assertEqual(attendance.status_code, 403)
        imported = teacher.post(
            "/api/academic/reports/bulk-import/",
            {"session": SESSION, "term": FIRST, "data": [{"student_id": self.ada.pk, "subject": "English"}]},
            format="json",
        )
        self.assertEqual(imported.status_code, 403)
        # Admins can still correct a closed term.
        admin = self.client_for(self.admin)
        self.assertEqual(admin.patch(f"/api/academic/scores/{score.pk}/", {"exam": 45}, format="json").status_code, 200)
        # The new term is open to teachers.
        attendance = teacher.post(
            "/api/academic/attendance-sessions/",
            {"date": "2026-01-06", "class_id": self.jss1.pk, "session": SESSION, "term": SECOND, "records": []},
            format="json",
        )
        self.assertEqual(attendance.status_code, 201, attendance.data)

    def test_balances_match_the_bursary_screens(self):
        balances = term_balances(self.school, SESSION, FIRST)
        self.assertEqual(balances[self.ada.pk]["bill"], Decimal("60000"))  # tuition + the bus she takes
        self.assertEqual(balances[self.ada.pk]["balance"], Decimal("40000"))
        self.assertEqual(balances[self.bola.pk]["balance"], Decimal("0"))

    def test_bursar_copies_fees_and_carries_balances_forward(self):
        start_term(self.term(SECOND), self.admin)
        bursar = self.client_for(self.bursar)
        status = bursar.get("/api/bursary/term-setup/").data
        self.assertEqual(status["term"]["term"], SECOND)
        self.assertEqual(status["fee_items"], 0)
        self.assertEqual(len(status["fees_to_copy"]), 2)
        self.assertEqual([d["names"] for d in status["debtors"]], ["Ada"])
        self.assertEqual(status["debt_total"], Decimal("40000"))

        self.assertEqual(bursar.post("/api/bursary/term-setup/", {"action": "copy_fees"}).data["created"], 2)
        self.assertEqual(bursar.post("/api/bursary/term-setup/", {"action": "copy_fees"}).data["created"], 0)

        moved = bursar.post(
            "/api/bursary/term-setup/", {"action": "carry_forward", "student_ids": [self.ada.pk]}, format="json"
        )
        self.assertEqual(moved.data["moved"], 1)
        # Second Term: 50,000 tuition + 10,000 bus + 40,000 brought forward. First Term is now settled.
        self.assertEqual(term_balances(self.school, SESSION, SECOND)[self.ada.pk]["bill"], Decimal("100000"))
        self.assertEqual(term_balances(self.school, SESSION, FIRST)[self.ada.pk]["balance"], Decimal("0"))
        # Running it again moves nothing twice.
        again = bursar.post(
            "/api/bursary/term-setup/", {"action": "carry_forward", "student_ids": [self.ada.pk]}, format="json"
        )
        self.assertEqual(again.data["moved"], 0)
        self.assertEqual(bursar.get("/api/bursary/term-setup/").data["debtors"], [])

        # The dashboard's figures follow the same bills: Ada 100,000 and Bola 50,000, nothing paid yet.
        stats = bursar.get("/api/bursary/dashboard/financial-stats/").data
        self.assertEqual((stats["expected_revenue"], stats["total_outstanding"]), (150000.0, 150000.0))

        teacher = self.client_for(self.teacher_user)
        self.assertEqual(teacher.get("/api/bursary/term-setup/").status_code, 403)
