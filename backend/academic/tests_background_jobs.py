"""P8/P9: bulk report-card PDFs and student CSV imports run as background jobs."""

from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from academic.models import Class, Student
from schools.models import School
from users.models import User

MEMORY_STORAGE = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@override_settings(STORAGES=MEMORY_STORAGE)
class BackgroundJobTests(TestCase):
    def setUp(self):
        # CI has a real broker; run tasks inline so the job finishes inside the test.
        from config.celery import app

        previous = (app.conf.task_always_eager, app.conf.task_eager_propagates)
        app.conf.task_always_eager, app.conf.task_eager_propagates = True, True
        self.addCleanup(lambda: setattr(app.conf, "task_always_eager", previous[0]))
        self.addCleanup(lambda: setattr(app.conf, "task_eager_propagates", previous[1]))
        self.school = School.objects.create(name="Jobs School", domain="jobs-school")
        self.cls = Class.objects.create(name="JSS 1", school=self.school)
        self.admin = User.objects.create_user(
            username="admin@jobs", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.student_user = User.objects.create_user(
            username="student@jobs", password="Strong-Pass!2026", role="STUDENT", school=self.school
        )
        self.client = APIClient()

    def _as(self, user):
        self.client.force_authenticate(user)

    def test_bulk_report_cards_queue_poll_download(self):
        self._as(self.admin)
        with mock.patch("academic.utils.ReportCardPDFGenerator.generate_bulk") as gen:
            import io

            gen.return_value = io.BytesIO(b"%PDF-1.4 fake")
            r = self.client.post(
                f"/api/academic/classes/{self.cls.pk}/bulk-export-report-cards-pdf/?session=2025/2026&term=First Term"
            )
        self.assertEqual(r.status_code, 202)
        job_id = r.data["job_id"]
        self.assertEqual(self.client.get(f"/api/academic/classes/export-jobs/{job_id}/").data["status"], "done")
        d = self.client.get(f"/api/academic/classes/export-jobs/{job_id}/download/")
        self.assertEqual(d.status_code, 200)
        self.assertEqual(b"".join(d.streaming_content), b"%PDF-1.4 fake")

    def test_export_job_hidden_from_other_schools(self):
        self._as(self.admin)
        with mock.patch("academic.utils.ReportCardPDFGenerator.generate_bulk") as gen:
            import io

            gen.return_value = io.BytesIO(b"%PDF")
            job_id = self.client.post(
                f"/api/academic/classes/{self.cls.pk}/bulk-export-report-cards-pdf/?session=s&term=t"
            ).data["job_id"]
        other = School.objects.create(name="Other", domain="other-jobs")
        self._as(
            User.objects.create_user(username="x@other", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=other)
        )
        self.assertEqual(self.client.get(f"/api/academic/classes/export-jobs/{job_id}/").status_code, 404)

    def test_student_import_runs_as_job_and_reports_row_errors(self):
        self._as(self.admin)
        csv_text = (
            "student_no,names,gender,date_of_birth,class_name,parent_name,parent_email,parent_phone,address,password\n"
            "ST1,Ada Obi,Female,2012-01-02,JSS 1,Mr Obi,obi@example.com,0800,Lagos,\n"
            ",Missing Number,Male,,JSS 1,,,,,\n"
        )
        r = self.client.post(
            "/api/academic/data-migration/import-students/",
            {"file": SimpleUploadedFile("s.csv", csv_text.encode(), "text/csv")},
            format="multipart",
        )
        self.assertEqual(r.status_code, 202)
        job = self.client.get(f"/api/academic/data-migration/jobs/{r.data['job_id']}/").data
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["success_count"], 1, job["errors"])
        self.assertEqual(job["error_count"], 1)
        self.assertTrue(Student.objects.filter(school=self.school, student_no="ST1", current_class=self.cls).exists())

    def test_students_cannot_import_or_export(self):
        self._as(self.student_user)
        self.assertEqual(self.client.get("/api/academic/data-migration/export-students/").status_code, 403)
        r = self.client.post(
            "/api/academic/data-migration/import-students/",
            {"file": SimpleUploadedFile("s.csv", b"names\n", "text/csv")},
            format="multipart",
        )
        self.assertEqual(r.status_code, 403)
        self.assertEqual(self.client.post("/api/data-import/import/", {}).status_code, 403)
