"""School structure wizard: sections, classes, arms, departments, subjects and promotion chains."""

from django.test import TestCase
from rest_framework.test import APIClient

from academic.models import Class, SchoolSection, Subject
from schools.models import School
from users.models import User


class SetupTestBase(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Setup School", domain="setup-school")
        self.admin = User.objects.create_user(
            username="admin@setup", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.headers = {"HTTP_X_TENANT_ID": self.school.domain}

    def post(self, path, body):
        return self.client.post(f"/api/academic/school-structure/{path}", body, format="json", **self.headers)

    def classes(self):
        return {c.name: c for c in Class.objects.filter(school=self.school)}


class SchoolSetupTests(SetupTestBase):
    def test_primary_only_school(self):
        r = self.post(
            "apply/",
            {"naming": "classic", "sections": [{"key": "primary", "subjects": ["English Studies", "Mathematics"]}]},
        )
        self.assertEqual(r.status_code, 201, r.data)
        classes = self.classes()
        self.assertEqual(sorted(classes), [f"Primary {n}" for n in range(1, 7)])
        self.assertEqual(classes["Primary 1"].next_class, classes["Primary 2"])
        self.assertTrue(classes["Primary 6"].is_graduation_class)  # primary-only: they graduate
        self.assertEqual(
            sorted(s.name for s in classes["Primary 3"].subjects.all()), ["English Studies", "Mathematics"]
        )
        self.assertEqual(SchoolSection.objects.get(school=self.school).head_title, "Head Teacher")

    def test_combined_school_with_arms_promotes_across_sections(self):
        r = self.post(
            "apply/",
            {
                "naming": "classic",
                "sections": [
                    {"key": "early_years", "levels": ["Nursery 1", "Nursery 2"], "subjects": ["Numeracy"]},
                    {"key": "primary", "arms": ["A", "B"], "subjects": ["Mathematics"]},
                    {"key": "junior", "arms": ["A", "B"], "subjects": ["Mathematics"]},
                ],
            },
        )
        self.assertEqual(r.status_code, 201, r.data)
        c = self.classes()
        self.assertEqual(c["Nursery 2"].next_class, c["Primary 1 A"])  # no arms in nursery: first arm
        self.assertEqual(c["Primary 6 B"].next_class, c["JSS 1 B"])  # same arm across sections
        self.assertFalse(c["Primary 6 A"].is_graduation_class)
        self.assertTrue(c["JSS 3 A"].is_graduation_class)
        self.assertEqual(c["Nursery 1"].report_mode, "early_years")
        self.assertEqual(c["JSS 2 A"].category, "JSS")

    def test_basic_naming_and_senior_departments(self):
        r = self.post(
            "apply/",
            {
                "naming": "basic",
                "sections": [
                    {"key": "junior", "subjects": ["English Language"]},
                    {
                        "key": "senior",
                        "subjects": ["English Language", "Mathematics"],
                        "departments": [
                            {"key": "science", "subjects": ["Physics", "Chemistry"]},
                            {"key": "arts", "subjects": ["Government"]},
                        ],
                    },
                ],
            },
        )
        self.assertEqual(r.status_code, 201, r.data)
        c = self.classes()
        self.assertIn("Basic 7", c)
        self.assertEqual(c["SS 1 Science"].category, "SSS_Science")
        self.assertEqual(c["SS 2 Arts"].category, "SSS_Art")
        self.assertEqual(
            sorted(s.name for s in c["SS 1 Science"].subjects.all()),
            ["Chemistry", "English Language", "Mathematics", "Physics"],
        )
        self.assertNotIn("Physics", [s.name for s in c["SS 1 Arts"].subjects.all()])
        self.assertEqual(c["SS 1 Arts"].next_class, c["SS 2 Arts"])  # department kept on promotion
        # Subjects are shared, not duplicated per class.
        self.assertEqual(Subject.objects.filter(school=self.school, name="English Language").count(), 1)

    def test_preview_saves_nothing_and_existing_classes_are_kept(self):
        existing = Class.objects.create(school=self.school, name="Primary 1", category="Primary")
        existing.subjects.set([Subject.objects.create(school=self.school, name="Bible Knowledge")])
        plan = self.post("preview/", {"sections": [{"key": "primary", "subjects": ["Mathematics"]}]}).data
        self.assertEqual(plan["summary"]["existing_classes"], 1)
        self.assertEqual(plan["summary"]["new_classes"], 5)
        self.assertEqual(plan["summary"]["new_subjects"], ["Mathematics"])  # from the 5 new classes only
        self.assertEqual(Class.objects.filter(school=self.school).count(), 1)

        self.post("apply/", {"sections": [{"key": "primary", "subjects": ["Mathematics"]}]})
        existing.refresh_from_db()
        self.assertEqual([s.name for s in existing.subjects.all()], ["Bible Knowledge"])  # untouched
        self.assertEqual(existing.section.key, "primary")
        self.assertIsNotNone(existing.next_class)

    def test_running_setup_again_adds_a_section_without_duplicates(self):
        self.post("apply/", {"sections": [{"key": "primary"}]})
        self.post("apply/", {"sections": [{"key": "primary"}, {"key": "junior"}]})
        self.assertEqual(Class.objects.filter(school=self.school, name="Primary 1").count(), 1)
        self.assertEqual(SchoolSection.objects.filter(school=self.school).count(), 2)

    def test_validation_and_permissions(self):
        self.assertEqual(self.post("preview/", {"sections": []}).status_code, 400)
        self.assertEqual(self.post("preview/", {"sections": [{"key": "university"}]}).status_code, 400)
        self.assertEqual(
            self.post("preview/", {"sections": [{"key": "primary", "levels": ["x" * 41]}]}).status_code, 400
        )
        self.assertEqual(self.post("preview/", {"sections": [{"key": "primary", "arms": ["<b>"]}]}).status_code, 400)
        teacher = User.objects.create_user(
            username="t@setup", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        self.client.force_authenticate(teacher)
        self.assertEqual(self.post("apply/", {"sections": [{"key": "primary"}]}).status_code, 403)

    def test_structure_endpoint_suggests_sections_for_existing_schools(self):
        Class.objects.create(school=self.school, name="JSS 1", category="JSS")
        Class.objects.create(school=self.school, name="Nursery 1", category="Nursery")
        data = self.client.get("/api/academic/school-structure/", **self.headers).data
        self.assertEqual(data["suggested_sections"], ["early_years", "junior"])
        self.assertEqual(len(data["catalogue"]), 4)


class SectionGuessTests(TestCase):
    def test_names_beat_categories(self):
        from academic.curriculum import section_for_class

        cases = {
            ("JSS 2", "Primary"): "junior",  # category left at its default
            ("SS 3 Science", "Primary"): "senior",
            ("Basic 8", ""): "junior",
            ("Basic 4", ""): "primary",
            ("Nursery 2", "Primary"): "early_years",
            ("Pre-Nursery", ""): "early_years",
            ("Gold House", "JSS"): "junior",  # unknown name: fall back to category
        }
        for (name, category), expected in cases.items():
            self.assertEqual(section_for_class(name, category), expected, name)


class CustomLevelTests(SetupTestBase):
    def test_school_specific_class_names_in_their_own_order(self):
        """Heritage Kastle style: Reception … Preschool 2, then Grade 1–6."""
        r = self.post(
            "apply/",
            {
                "sections": [
                    {
                        "key": "early_years",
                        "levels": ["Reception", "Preparatory", "Preschool 1", "Preschool 2"],
                        "subjects": ["Literacy", "Numeracy", "Social Norms"],
                    },
                    {"key": "primary", "levels": [f"Grade {n}" for n in range(1, 7)], "subjects": ["Diction", "Chess"]},
                ]
            },
        )
        self.assertEqual(r.status_code, 201, r.data)
        c = self.classes()
        self.assertEqual(c["Reception"].next_class, c["Preparatory"])
        self.assertEqual(c["Preschool 2"].next_class, c["Grade 1"])
        self.assertTrue(c["Grade 6"].is_graduation_class)
        self.assertEqual(c["Preparatory"].report_mode, "early_years")
        self.assertEqual(c["Grade 3"].section.key, "primary")

    def test_preparatory_and_preschool_are_recognised_as_early_years(self):
        from academic.curriculum import section_for_class

        for name in ("Reception", "Preparatory", "Preschool 1", "Pre-School 2"):
            self.assertEqual(section_for_class(name, "Primary"), "early_years", name)
