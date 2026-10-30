"""Per-student subjects: compulsory subjects for the class, electives (e.g. by department) per student."""

from django.test import TestCase
from rest_framework.test import APIClient

from academic.models import Class, Student, Subject
from schools.models import School
from users.models import User

CORE = ["English Language", "Mathematics", "Civic Education"]
SCIENCE = ["Physics", "Chemistry", "Biology"]
ARTS = ["Literature in English", "Government"]


class SubjectChoiceTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Choice School", domain="choices")
        self.cls = Class.objects.create(school=self.school, name="SSS 1", category="SSS_Science")
        self.cls.subjects.set([Subject.objects.create(school=self.school, name=n) for n in CORE + SCIENCE + ARTS])
        self.ada = Student.objects.create(
            school=self.school, names="Ada", student_no="C1", gender="Female", current_class=self.cls
        )
        self.bola = Student.objects.create(
            school=self.school, names="Bola", student_no="C2", gender="Male", current_class=self.cls
        )
        admin = User.objects.create_user(
            username="head@choices", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = APIClient()
        self.client.force_authenticate(admin)
        self.client.credentials(HTTP_X_TENANT_ID=self.school.domain)
        self.url = f"/api/academic/classes/{self.cls.pk}/subject-choices/"

    def test_by_default_everyone_takes_everything(self):
        data = self.client.get(self.url).data
        self.assertEqual(set(data["compulsory"]), set(CORE + SCIENCE + ARTS))
        self.assertEqual([p["label"] for p in data["presets"]], ["Science", "Arts"])  # only offered ones
        self.assertEqual(len(data["students"][0]["subjects"]), 8)

    def test_core_plus_department_electives(self):
        r = self.client.put(
            self.url,
            {"compulsory": CORE, "choices": {str(self.ada.pk): SCIENCE, str(self.bola.pk): ARTS}},
            format="json",
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data["updated"], 2)
        self.ada.refresh_from_db()
        self.bola.refresh_from_db()
        self.assertEqual(set(self.ada.assigned_subjects), set(CORE + SCIENCE))
        self.assertEqual(set(self.bola.assigned_subjects), set(CORE + ARTS))
        # Score entry, broadsheets and report cards read it from the student list.
        listed = self.client.get("/api/academic/students/", {"class": self.cls.pk}).data["results"]
        self.assertEqual(
            {row["names"]: set(row["assigned_subjects"]) for row in listed},
            {"Ada": set(CORE + SCIENCE), "Bola": set(CORE + ARTS)},
        )

        # Changing one student's electives later keeps the class's compulsory list.
        r = self.client.put(self.url, {"choices": {str(self.bola.pk): ["Government"]}}, format="json")
        self.bola.refresh_from_db()
        self.assertEqual(set(self.bola.assigned_subjects), set(CORE + ["Government"]))
        self.assertEqual(set(r.data["compulsory"]), set(CORE))

    def test_rejects_subjects_the_class_does_not_offer_and_other_students(self):
        r = self.client.put(self.url, {"compulsory": CORE, "choices": {str(self.ada.pk): ["Astrology"]}}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("Astrology", r.data["detail"])
        stranger = Student.objects.create(school=self.school, names="Elsewhere", student_no="C9", gender="Male")
        r = self.client.put(self.url, {"choices": {str(stranger.pk): SCIENCE}}, format="json")
        self.assertEqual(r.status_code, 400)
        self.ada.refresh_from_db()
        self.assertEqual(self.ada.assigned_subjects, [])  # nothing half-saved

    def test_teachers_can_view_but_not_change(self):
        teacher = User.objects.create_user(
            username="t@choices", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        client = APIClient()
        client.force_authenticate(teacher)
        client.credentials(HTTP_X_TENANT_ID=self.school.domain)
        self.assertEqual(client.put(self.url, {"compulsory": CORE}, format="json").status_code, 403)
