"""External exams: entering a class, importing results and the school's 5-credit figure."""

from django.test import TestCase
from rest_framework.test import APIClient

from academic.external_exams import candidate_summary
from academic.models import Class, ExternalExamCandidate, Student, Subject
from schools.models import School
from users.models import User

GOOD = {"English Language": "B3", "Mathematics": "C4", "Physics": "A1", "Chemistry": "C6", "Biology": "B2"}
NO_MATHS = {**GOOD, "Mathematics": "D7"}


class ExternalExamTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Exam School", domain="exams")
        self.sss3 = Class.objects.create(school=self.school, name="SSS 3")
        self.sss3.subjects.set(
            [Subject.objects.create(school=self.school, name=n) for n in ["English Language", "Mathematics", "Physics"]]
        )
        self.ada = Student.objects.create(
            school=self.school, names="Ada", student_no="E1", gender="Female", current_class=self.sss3
        )
        self.bola = Student.objects.create(
            school=self.school, names="Bola", student_no="E2", gender="Male", current_class=self.sss3
        )
        self.admin = User.objects.create_user(
            username="head@exams", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = self.client_for(self.admin)
        self.exam = self.client.post(
            "/api/academic/external-exams/",
            {"body": "WAEC", "name": "WASSCE May/June 2027", "year": 2027, "target_class": self.sss3.pk},
            format="json",
        ).data

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        client.credentials(HTTP_X_TENANT_ID=self.school.domain)
        return client

    def test_five_credits_rule(self):
        self.assertTrue(candidate_summary("WAEC", GOOD)["five_credits_with_english_maths"])
        self.assertFalse(candidate_summary("WAEC", NO_MATHS)["five_credits_with_english_maths"])
        self.assertEqual(candidate_summary("JAMB", {"English": "62", "Physics": "70"})["score"], 132)

    def test_enter_class_import_results_and_summary(self):
        url = f"/api/academic/external-exams/{self.exam['id']}"
        r = self.client.post(f"{url}/register/", {}, format="json")
        self.assertEqual(r.data, {"registered": 2, "already_entered": 0})
        self.assertEqual(self.client.post(f"{url}/register/", {}, format="json").data["registered"], 0)
        ada = ExternalExamCandidate.objects.get(student=self.ada)
        self.assertEqual(set(ada.subjects), {"English Language", "Mathematics", "Physics"})  # what she takes
        ada.candidate_number = "4251234001"
        ada.save()

        rows = [{"candidate": "4251234001", "subject": s, "grade": g} for s, g in GOOD.items()]
        rows += [{"candidate": "E2", "subject": s, "grade": g} for s, g in NO_MATHS.items()]  # by admission no.
        rows += [{"candidate": "9999", "subject": "Physics", "grade": "A1"}]
        r = self.client.post(f"{url}/import-results/", {"rows": rows}, format="json")
        self.assertEqual(r.data, {"updated": 2, "unknown_candidates": ["9999"]})

        summary = self.client.get(f"{url}/summary/").data
        self.assertEqual((summary["five_credits_with_english_maths"], summary["five_credits_rate"]), (1, 50.0))
        self.assertEqual(summary["maths_credit_rate"], 50.0)

    def test_students_see_only_their_own_released_results(self):
        url = f"/api/academic/external-exams/{self.exam['id']}"
        self.client.post(f"{url}/register/", {}, format="json")
        ExternalExamCandidate.objects.filter(student=self.ada).update(results=GOOD, status="sat")
        user = User.objects.create_user(
            username="ada@exams", password="Strong-Pass!2026", role="STUDENT", school=self.school
        )
        self.ada.user = user
        self.ada.save()
        student = self.client_for(user)
        rows = student.get("/api/academic/external-exam-candidates/").data["results"]
        self.assertEqual([r["student_name"] for r in rows], ["Ada"])
        self.assertEqual(rows[0]["results"], {})  # not released yet
        ExternalExamCandidate.objects.filter(student=self.ada).update(status="released")
        rows = student.get("/api/academic/external-exam-candidates/").data["results"]
        self.assertEqual(rows[0]["results"]["Physics"], "A1")
        self.assertEqual(student.post(f"{url}/register/", {}, format="json").status_code, 403)
