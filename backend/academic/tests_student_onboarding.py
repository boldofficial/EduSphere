"""Student onboarding: Excel/CSV import, admission numbers, temporary passwords and safe sign-in."""

import csv
import io
from datetime import date
from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from openpyxl import Workbook
from rest_framework.test import APIClient

from academic.models import Class, Student
from academic.student_onboarding import ImportFileError, build_preview, read_rows
from schools.models import School
from users.models import User


def csv_file(rows, name="students.csv"):
    buf = io.StringIO()
    csv.writer(buf).writerows(rows)
    return SimpleUploadedFile(name, buf.getvalue().encode("utf-8"), "text/csv")


def xlsx_file(rows):
    wb = Workbook()
    for row in rows:
        wb.active.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return SimpleUploadedFile(
        "students.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


class OnboardingBase(TestCase):
    def setUp(self):
        # Sign-in calls here count against the shared login throttle; start and finish with a clean slate.
        cache.clear()
        self.addCleanup(cache.clear)
        self.school = School.objects.create(name="Onboard School", domain="onboard")
        self.cls = Class.objects.create(school=self.school, name="Primary 3", category="Primary")
        self.admin = User.objects.create_user(
            username="admin@onboard",
            email="head@onboard.test",
            password="Strong-Pass!2026",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.headers = {"HTTP_X_TENANT_ID": self.school.domain}

    def run_import(self, upload, **options):
        from academic import tasks

        with mock.patch.object(
            tasks.import_students_rows, "delay", side_effect=lambda *a: tasks.import_students_rows(*a)
        ):
            r = self.client.post(
                "/api/academic/data-migration/import-students/",
                {"file": upload, **{k: str(v) for k, v in options.items()}},
                format="multipart",
                **self.headers,
            )
        self.assertEqual(r.status_code, 202, r.data)
        return (
            self.client.get(f"/api/academic/data-migration/jobs/{r.data['job_id']}/", **self.headers).data,
            r.data["job_id"],
        )


class ReadingFilesTests(TestCase):
    def test_csv_headings_schools_actually_use(self):
        rows = read_rows(
            csv_file(
                [
                    ["Adm No", "Surname", "First Name", "Sex", "DOB", "Class"],
                    ["HK/1", "Okafor", "Ada", "F", "15/05/2016", "primary3"],
                ]
            )
        )
        self.assertEqual(rows[0]["student_no"], "HK/1")
        self.assertEqual((rows[0]["surname"], rows[0]["first_name"], rows[0]["gender"]), ("Okafor", "Ada", "F"))

    def test_excel_file_with_numbers_and_dates(self):
        rows = read_rows(
            xlsx_file(
                [
                    ["Admission Number", "Full Name", "Gender", "Date of Birth"],
                    [1023, "Bello Tunde", "Male", date(2015, 1, 2)],
                ]
            )
        )
        self.assertEqual(rows[0]["student_no"], "1023")  # not "1023.0"
        self.assertEqual(rows[0]["dob"].date(), date(2015, 1, 2))  # Excel dates arrive as datetimes

    def test_headings_from_the_previous_template_still_work(self):
        rows = read_rows(
            csv_file([["student_no", "names", "class_name", "parent_email"], ["ST1", "Ada", "JSS 1", "a@b.co"]])
        )
        self.assertEqual(
            (rows[0]["student_no"], rows[0]["names"], rows[0]["class_name"], rows[0]["parent_email"]),
            ("ST1", "Ada", "JSS 1", "a@b.co"),
        )

    def test_unusable_files(self):
        with self.assertRaises(ImportFileError):
            read_rows(csv_file([["Colour", "Size"], ["red", "L"]]))
        with self.assertRaises(ImportFileError):
            read_rows(SimpleUploadedFile("students.pdf", b"%PDF", "application/pdf"))


class PreviewTests(OnboardingBase):
    def test_every_problem_is_reported_by_row(self):
        Student.objects.create(school=self.school, student_no="HK/9", names="Old Name", gender="Male")
        rows = [
            {"names": "Ada Okafor", "gender": "F", "class_name": "PRIMARY 3"},
            {"names": "", "gender": "x", "class_name": "Primary 9"},
            {"student_no": "HK/9", "names": "New Name", "gender": "Male"},
            {"student_no": "HK/5", "names": "A", "gender": "M", "parent_email": "not-an-email"},
            {"student_no": "HK/5", "names": "B", "gender": "M"},
        ]
        preview = build_preview(self.school, rows)
        actions = [r["action"] for r in preview["rows"]]
        self.assertEqual(actions, ["create", "error", "update", "error", "error"])
        self.assertEqual(preview["rows"][0]["class_name"], "Primary 3")  # case/spacing-insensitive match
        self.assertIn("Primary 9", " ".join(preview["rows"][1]["errors"]))
        self.assertIn("more than once", " ".join(preview["rows"][4]["errors"]))
        self.assertEqual(Student.objects.filter(school=self.school).count(), 1)  # nothing saved


class ImportTests(OnboardingBase):
    def test_import_creates_students_with_numbers_accounts_and_login_slips(self):
        Student.objects.create(school=self.school, student_no="HKS/2026/0007", names="Earlier", gender="Male")
        upload = xlsx_file(
            [
                ["Surname", "First Name", "Gender", "Class", "Parent Email"],
                ["Okafor", "Ada", "F", "Primary 3", "mum@example.com"],
                ["Bello", "Tunde", "M", "Primary 3", "mum@example.com"],  # siblings share a parent email
            ]
        )
        job, job_id = self.run_import(upload, number_prefix="HKS/2026/")
        self.assertEqual((job["status"], job["created"], job["error_count"]), ("completed", 2, 0))
        numbers = sorted(
            Student.objects.filter(school=self.school, names__in=["Okafor Ada", "Bello Tunde"]).values_list(
                "student_no", flat=True
            )
        )
        self.assertEqual(numbers, ["HKS/2026/0008", "HKS/2026/0009"])  # continues after the highest

        slips = self.client.get(f"/api/academic/data-migration/jobs/{job_id}/credentials/", **self.headers)
        self.assertEqual(slips.status_code, 200)
        lines = slips.content.decode().strip().splitlines()
        self.assertEqual(len(lines), 3)
        student_no, _, _, password = lines[1].split(",")

        # The student signs in with admission number + temporary password, and must change it.
        user = Student.objects.get(student_no=student_no).user
        self.assertTrue(user.check_password(password))
        self.assertTrue(user.must_change_password)
        self.assertEqual(user.email, "")  # the parent email stays on the student record, not the login

    def test_plan_limit_is_respected(self):
        with mock.patch.object(School, "student_limit", new_callable=mock.PropertyMock, return_value=1):
            job, _ = self.run_import(csv_file([["Name", "Gender"], ["One", "M"], ["Two", "F"]]))
        self.assertEqual(job["created"], 1)
        self.assertIn("limit", job["errors"][0]["error"])

    def test_staff_without_admin_role_and_students_cannot_import(self):
        student = User.objects.create_user(
            username="s@onboard", password="Strong-Pass!2026", role="STUDENT", school=self.school
        )
        self.client.force_authenticate(student)
        r = self.client.post(
            "/api/academic/data-migration/import-students/preview/",
            {"file": csv_file([["Name"], ["x"]])},
            format="multipart",
            **self.headers,
        )
        self.assertEqual(r.status_code, 403)


class LoginAndPasswordTests(OnboardingBase):
    def test_reset_password_and_first_sign_in_change(self):
        student = Student.objects.create(
            school=self.school, student_no="HK/1", names="Ada", gender="Female", current_class=self.cls
        )
        r = self.client.post(f"/api/academic/students/{student.id}/reset-password/", **self.headers)
        self.assertEqual(r.status_code, 200, r.data)
        temp = r.data["password"]

        client = APIClient()
        token = client.post(
            "/api/token/", {"username": "HK/1@onboard", "password": temp}, format="json", HTTP_X_TENANT_ID="onboard"
        )
        self.assertEqual(token.status_code, 200, token.data)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
        self.assertTrue(client.get("/api/users/me/", HTTP_X_TENANT_ID="onboard").data["must_change_password"])
        bad = client.post(
            "/api/users/change-password/", {"current_password": temp, "new_password": "short"}, format="json"
        )
        self.assertEqual(bad.status_code, 400)
        ok = client.post(
            "/api/users/change-password/",
            {"current_password": temp, "new_password": "Brand-New!Pass2026"},
            format="json",
        )
        self.assertEqual(ok.status_code, 200, ok.data)
        student.refresh_from_db()
        self.assertFalse(student.user.must_change_password)

    def test_issue_logins_for_a_class(self):
        Student.objects.create(
            school=self.school, student_no="HK/1", names="Ada", gender="Female", current_class=self.cls
        )
        Student.objects.create(
            school=self.school, student_no="HK/2", names="Bola", gender="Female", current_class=self.cls
        )
        r = self.client.post(
            "/api/academic/students/issue-logins/", {"class_id": self.cls.id}, format="json", **self.headers
        )
        self.assertEqual(r.data["count"], 2)
        again = self.client.post(
            "/api/academic/students/issue-logins/", {"class_id": self.cls.id}, format="json", **self.headers
        )
        self.assertEqual(again.data["count"], 0)  # only students without an account

    def test_shared_email_never_signs_into_the_wrong_account(self):
        parent = User.objects.create_user(
            username="parent1",
            email="family@example.com",
            password="Parent-Pass!2026",
            role="PARENT",
            school=self.school,
        )
        User.objects.create_user(
            username="kid@onboard",
            email="family@example.com",
            password="Kid-Pass!2026",
            role="STUDENT",
            school=self.school,
        )
        client = APIClient()
        # Two accounts share the address: email sign-in is refused rather than guessing.
        self.assertEqual(
            client.post(
                "/api/token/", {"username": "family@example.com", "password": "Parent-Pass!2026"}, format="json"
            ).status_code,
            401,
        )
        self.assertEqual(
            client.post(
                "/api/token/", {"username": "parent1", "password": "Parent-Pass!2026"}, format="json"
            ).status_code,
            200,
        )
        self.assertTrue(parent.check_password("Parent-Pass!2026"))

    @mock.patch("emails.notify.queue_template_email")
    def test_student_forgot_password_goes_to_the_parent_email_on_record(self, queued):
        student = Student.objects.create(
            school=self.school, student_no="HK/1", names="Ada", gender="Female", parent_email="mum@example.com"
        )
        from academic.student_onboarding import ensure_login

        ensure_login(student)
        client = APIClient()
        with self.captureOnCommitCallbacks(execute=True):
            r = client.post(
                "/api/users/password-reset-request/",
                {"student_no": "HK/1", "email": "mum@example.com"},
                format="json",
                HTTP_X_TENANT_ID="onboard",
            )
        self.assertEqual(r.status_code, 200)
        queued.assert_called_once()
        self.assertEqual(queued.call_args.args[1], ["mum@example.com"])
        self.assertIn("https://onboard.", queued.call_args.args[2]["reset_url"])

        queued.reset_mock()
        client.post(
            "/api/users/password-reset-request/",
            {"student_no": "HK/1", "email": "stranger@example.com"},
            format="json",
            HTTP_X_TENANT_ID="onboard",
        )
        queued.assert_not_called()  # wrong parent email: nothing sent, same reply
