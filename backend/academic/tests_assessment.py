"""Assessment parts and grading per section: validation, server-side grades, PDF/report settings."""

from django.test import SimpleTestCase, TestCase
from rest_framework import serializers
from rest_framework.test import APIClient

from academic.assessment import BASIC_SCALE, WAEC_SCALE, clean_assessment, grade_for
from academic.models import Class, GradeRange, GradingScheme, ReportCard, SchoolSection, Student
from schools.models import School
from users.models import User


class AssessmentRulesTests(SimpleTestCase):
    def test_parts_must_add_up_to_100(self):
        ok = clean_assessment(
            {"ca1": {"label": "CA", "max": 40}, "ca2": {"enabled": False}, "exam": {"label": "Exam", "max": 60}}
        )
        self.assertEqual(ok["ca2"], {"label": "CA 2", "max": 0, "enabled": False})
        with self.assertRaisesMessage(serializers.ValidationError, "add up to 100 (they add up to 90)"):
            clean_assessment({"ca1": {"max": 20}, "ca2": {"max": 10}, "exam": {"max": 60}})
        with self.assertRaises(serializers.ValidationError):
            clean_assessment({"ca1": {"max": 0}, "ca2": {"max": 40}, "exam": {"max": 60}})

    def test_observation_only_sections_are_allowed(self):
        cleaned = clean_assessment({k: {"enabled": False} for k in ("ca1", "ca2", "exam")})
        self.assertFalse(any(p["enabled"] for p in cleaned.values()))

    def test_built_in_scales(self):
        self.assertEqual(grade_for(75, WAEC_SCALE), ("A1", "Excellent"))
        self.assertEqual(grade_for(52, WAEC_SCALE), ("C6", "Credit"))
        self.assertEqual(grade_for(39.5, WAEC_SCALE), ("F9", "Fail"))
        self.assertEqual(grade_for(70, BASIC_SCALE), ("A", "Excellent"))
        self.assertEqual(grade_for(44, BASIC_SCALE), ("E", "Pass"))


class GradingTestBase(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Grade School", domain="grade-school")
        self.admin = User.objects.create_user(
            username="admin@grade", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.senior = SchoolSection.objects.create(school=self.school, key="senior", name="College")
        self.primary = SchoolSection.objects.create(school=self.school, key="primary", name="Primary")
        self.ss1 = Class.objects.create(school=self.school, name="SSS 1", category="SSS_Science", section=self.senior)
        self.g1 = Class.objects.create(school=self.school, name="Grade 1", category="Primary", section=self.primary)
        self.student = Student.objects.create(
            school=self.school, student_no="G-1", names="Ada", gender="Female", current_class=self.ss1
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.headers = {"HTTP_X_TENANT_ID": self.school.domain}

    def save_scores(self, cls, rows):
        return self.client.post(
            "/api/academic/reports/",
            {
                "student_id": self.student.id,
                "class_id": cls.id,
                "session": "2026/2027",
                "term": "First Term",
                "rows": rows,
            },
            format="json",
            **self.headers,
        )

    def scores(self):
        return {s.subject.name: s for s in ReportCard.objects.get(student=self.student).scores.all()}


class SectionGradingTests(GradingTestBase):
    def test_senior_uses_waec_grades_whatever_the_client_sent(self):
        r = self.save_scores(self.ss1, [{"subject": "Physics", "ca1": 18, "ca2": 17, "exam": 42, "grade": "A*"}])
        self.assertEqual(r.status_code, 201, r.data)
        physics = self.scores()["Physics"]
        self.assertEqual(physics.total, 77)
        self.assertEqual((physics.grade, physics.comment), ("A1", "Excellent"))

    def test_scores_above_the_maximum_are_rejected(self):
        r = self.save_scores(self.ss1, [{"subject": "Physics", "ca1": 25, "ca2": 0, "exam": 0}])
        self.assertEqual(r.status_code, 400)
        self.assertIn("cannot be more than 20", str(r.data))
        self.assertFalse(ReportCard.objects.exists())  # nothing half-saved

    def test_ca40_exam60_section(self):
        r = self.client.patch(
            f"/api/academic/school-structure/sections/{self.primary.id}/",
            {
                "assessment": {
                    "ca1": {"label": "CA", "max": 40, "enabled": True},
                    "ca2": {"enabled": False},
                    "exam": {"label": "Exam", "max": 60, "enabled": True},
                },
                "show_position": False,
            },
            format="json",
            **self.headers,
        )
        self.assertEqual(r.status_code, 200, r.data)
        config = self.client.get(f"/api/academic/classes/{self.g1.id}/", **self.headers).data["assessment"]
        self.assertEqual([(p["label"], p["max"]) for p in config["parts"]], [("CA", 40), ("Exam", 60)])
        self.assertFalse(config["show_position"])
        self.assertEqual(config["grading"][0]["grade"], "A")  # basic scale outside senior

        self.assertEqual(self.save_scores(self.g1, [{"subject": "Maths", "ca1": 35, "exam": 50}]).status_code, 201)
        self.assertEqual(self.scores()["Maths"].total, 85)
        bad = self.save_scores(self.g1, [{"subject": "Maths", "ca1": 30, "ca2": 5, "exam": 50}])
        self.assertEqual(bad.status_code, 400)
        self.assertIn("does not use CA 2", str(bad.data))

    def test_section_grading_scheme_overrides_the_built_in_scale(self):
        scheme = GradingScheme.objects.create(school=self.school, name="House scale")
        GradeRange.objects.create(
            school=self.school, scheme=scheme, grade="Distinction", min_score=80, max_score=100, remark="Top"
        )
        GradeRange.objects.create(
            school=self.school, scheme=scheme, grade="Merit", min_score=0, max_score=79.99, remark="Keep going"
        )
        r = self.client.patch(
            f"/api/academic/school-structure/sections/{self.senior.id}/",
            {"grading_scheme": scheme.id},
            format="json",
            **self.headers,
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.save_scores(self.ss1, [{"subject": "Physics", "ca1": 20, "ca2": 20, "exam": 45}])
        self.assertEqual(self.scores()["Physics"].grade, "Distinction")

    def test_section_settings_are_validated_and_admin_only(self):
        url = f"/api/academic/school-structure/sections/{self.primary.id}/"
        bad = self.client.patch(
            url,
            {"assessment": {"ca1": {"max": 50}, "ca2": {"max": 50}, "exam": {"max": 60}}},
            format="json",
            **self.headers,
        )
        self.assertEqual(bad.status_code, 400)
        other = School.objects.create(name="Other", domain="other-grade")
        foreign = GradingScheme.objects.create(school=other, name="Theirs")
        self.assertEqual(
            self.client.patch(url, {"grading_scheme": foreign.id}, format="json", **self.headers).status_code, 400
        )
        teacher = User.objects.create_user(
            username="t@grade", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        self.client.force_authenticate(teacher)
        self.assertEqual(
            self.client.patch(url, {"show_position": False}, format="json", **self.headers).status_code, 403
        )


class BulkScoreImportTests(GradingTestBase):
    def test_bulk_import_saves_good_rows_and_reports_bad_ones(self):
        r = self.client.post(
            "/api/academic/reports/bulk-import/",
            {
                "session": "2026/2027",
                "term": "First Term",
                "mode": "upsert",
                "data": [
                    {"student_id": self.student.id, "subject": "Physics", "ca1": 15, "ca2": 15, "exam": 40},
                    {"student_id": self.student.id, "subject": "Chemistry", "ca1": 30, "ca2": 0, "exam": 0},
                    {"student_id": 999999, "subject": "Biology", "ca1": 1, "ca2": 1, "exam": 1},
                ],
            },
            format="json",
            **self.headers,
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual((r.data["imported"], r.data["failed"]), (1, 2))
        self.assertIn("cannot be more than 20", r.data["errors"][0]["error"])
        physics = self.scores()["Physics"]
        self.assertEqual((physics.total, physics.grade), (70, "B2"))
        self.assertEqual(ReportCard.objects.get(student=self.student).total_score, 70)

    def test_students_cannot_import(self):
        student_user = User.objects.create_user(
            username="s@grade", password="Strong-Pass!2026", role="STUDENT", school=self.school
        )
        self.client.force_authenticate(student_user)
        r = self.client.post(
            "/api/academic/reports/bulk-import/",
            {"session": "x", "term": "y", "data": []},
            format="json",
            **self.headers,
        )
        self.assertEqual(r.status_code, 403)
