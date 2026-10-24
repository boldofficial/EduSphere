"""Report cards per section: the section's head signs them, and only real remarks are printed."""

from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient

from academic.assessment import public_config
from academic.models import Class, ReportCard, SchoolSection, Student
from academic.utils import ReportCardPDFGenerator
from schools.models import School
from users.models import User

PIXEL = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
)


class ReportSectionTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Kastle & Co Schools", domain="kastle")
        self.nursery = SchoolSection.objects.create(
            school=self.school, key="nursery", name="Nursery", head_title="Head Teacher", head_name="Mrs. Ade"
        )
        self.cls = Class.objects.create(school=self.school, name="Reception", section=self.nursery)
        self.student = Student.objects.create(
            school=self.school, names="Ada <Obi>", student_no="K1", gender="Female", current_class=self.cls
        )
        self.admin = User.objects.create_user(
            username="head@kastle", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.client.credentials(HTTP_X_TENANT_ID=self.school.domain)

    def test_section_signatory_reaches_the_report_settings(self):
        r = self.client.patch(
            f"/api/academic/school-structure/sections/{self.nursery.pk}/",
            {"head_title": "Proprietress", "head_signature": PIXEL},
            format="json",
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.nursery.refresh_from_db()
        self.assertTrue(self.nursery.head_signature)
        self.assertFalse(self.nursery.head_signature.startswith("data:"))  # stored as a file, not inline

        signer = public_config(self.cls)["section"]
        self.assertEqual((signer["head_title"], signer["head_name"]), ("Proprietress", "Mrs. Ade"))

        r = self.client.patch(
            f"/api/academic/school-structure/sections/{self.nursery.pk}/", {"head_signature": ""}, format="json"
        )
        self.assertEqual(r.data["head_signature"], "")

    def test_pdf_handles_markup_characters_and_never_invents_remarks(self):
        card = ReportCard.objects.create(
            school=self.school,
            student=self.student,
            student_class=self.cls,
            session="2025/2026",
            term="First Term",
            teacher_remark="Maths & English < expected; see me",
        )
        texts = []
        real_paragraph = __import__("reportlab.platypus", fromlist=["Paragraph"]).Paragraph

        def spy(text, *args, **kwargs):
            texts.append(str(text))
            return real_paragraph(text, *args, **kwargs)

        with mock.patch("reportlab.platypus.Paragraph", side_effect=spy):
            pdf = ReportCardPDFGenerator(self.school).generate_single(card)
        self.assertTrue(pdf.getvalue().startswith(b"%PDF"))  # the "&" and "<" no longer break it
        joined = " ".join(texts)
        self.assertIn("Maths &amp; English &lt; expected", joined)
        self.assertIn("Head Teacher's Remark", joined)
        self.assertIn("Mrs. Ade", joined)
        for stock in ("Satisfactory performance", "Consult class teacher"):
            self.assertNotIn(stock, joined)
