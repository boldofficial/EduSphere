"""Data migration ViewSet — CSV import/export for students."""

import csv

from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import FinanceOnly

MAX_IMPORT_BYTES = 5 * 1024 * 1024


class AcademicDataMigrationViewSet(viewsets.ViewSet):
    """
    ViewSet for handling data migration tasks:
    1. Downloading CSV templates
    2. Bulk importing students
    """

    # Imports and exports cover every student's personal data: admins and office staff only.
    permission_classes = [FinanceOnly]

    @action(detail=False, methods=["get"], url_path="student-template")
    def download_student_template(self, request):
        """CSV template for the student import (Excel files with the same headings work too)."""
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="student_import_template.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "Admission No",
                "Surname",
                "First Name",
                "Middle Name",
                "Gender",
                "Date of Birth",
                "Class",
                "Parent Name",
                "Parent Email",
                "Parent Phone",
                "Address",
            ]
        )
        writer.writerow(
            [
                "",
                "Okafor",
                "Adaeze",
                "Chioma",
                "Female",
                "15/05/2016",
                "Primary 3",
                "Mrs. Ngozi Okafor",
                "ngozi.okafor@example.com",
                "08012345678",
                "12 Allen Avenue, Ikeja",
            ]
        )
        return response

    def _rows_and_options(self, request):
        from ..student_onboarding import ImportFileError, read_rows

        upload = request.FILES.get("file")
        if not upload:
            return None, None, Response({"detail": "Choose an Excel or CSV file."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rows = read_rows(upload)
        except ImportFileError as error:
            return None, None, Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        options = {
            "update_existing": str(request.data.get("update_existing", "true")).lower() != "false",
            "auto_number": str(request.data.get("auto_number", "true")).lower() != "false",
            "number_prefix": " ".join(str(request.data.get("number_prefix") or "").split())[:20],
        }
        return rows, options, None

    @action(detail=False, methods=["post"], url_path="import-students/preview")
    def preview_students(self, request):
        """Check a file without saving anything: what will be created, updated or rejected, row by row."""
        from ..student_onboarding import build_preview

        rows, options, error = self._rows_and_options(request)
        if error:
            return error
        return Response(
            build_preview(
                request.user.school,
                rows,
                update_existing=options["update_existing"],
                auto_number=options["auto_number"],
            )
        )

    @action(detail=False, methods=["post"], url_path="import-students")
    def import_students(self, request):
        """
        Import students from an Excel/CSV file in the background. Returns 202 {job_id}; poll `jobs/<job_id>/`,
        then download the new accounts' login slips from `jobs/<job_id>/credentials/`.
        """
        from datetime import date

        from data_import.models import ImportJob

        from ..tasks import import_students_rows

        rows, options, error = self._rows_and_options(request)
        if error:
            return error
        # Celery messages are JSON: dates from Excel become ISO strings (read back by the importer).
        rows = [{k: (v.isoformat()[:10] if isinstance(v, date) else v) for k, v in r.items()} for r in rows]
        job = ImportJob.objects.create(
            school=request.user.school,
            import_type="students",
            file_name=request.FILES["file"].name[:255],
            created_by=request.user.username,
            total_rows=len(rows),
        )
        import_students_rows.delay(job.pk, rows, options)
        return Response(
            {"job_id": job.pk, "status": "pending", "total_rows": len(rows)}, status=status.HTTP_202_ACCEPTED
        )

    @action(detail=False, methods=["get"], url_path=r"jobs/(?P<job_id>[0-9]+)")
    def import_job(self, request, job_id=None):
        from django.core.cache import cache

        from data_import.models import ImportJob

        job = ImportJob.objects.filter(pk=job_id, school=request.user.school).first()
        if not job:
            return Response({"detail": "Import not found."}, status=status.HTTP_404_NOT_FOUND)
        result = cache.get(f"student-import:{job.pk}") or {}
        return Response(
            {
                "job_id": job.pk,
                "status": job.status,
                "total_rows": job.total_rows,
                "processed_rows": job.processed_rows,
                "created": result.get("created", 0),
                "updated": result.get("updated", 0),
                "success_count": job.success_rows,
                "error_count": job.failed_rows,
                "errors": job.errors[:200],
                "credentials_available": bool(result.get("credentials")),
            }
        )

    @action(detail=False, methods=["get"], url_path=r"jobs/(?P<job_id>[0-9]+)/credentials")
    def import_credentials(self, request, job_id=None):
        """
        Login slips for the accounts this import created: admission number + temporary password.
        Kept for 24 hours only; students must change the password at first sign-in.
        """
        from django.core.cache import cache

        from data_import.models import ImportJob

        job = ImportJob.objects.filter(pk=job_id, school=request.user.school).first()
        result = cache.get(f"student-import:{job.pk}") if job else None
        if not result or not result.get("credentials"):
            return Response(
                {"detail": "Login details are no longer available. Reset passwords from the Students page."},
                status=status.HTTP_404_NOT_FOUND,
            )
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="student_logins_{job.pk}.csv"'
        writer = csv.writer(response)
        writer.writerow(["Admission No (username)", "Student", "Class", "Temporary password"])
        for c in result["credentials"]:
            writer.writerow([c["student_no"], c["names"], c["class_name"], c["password"]])
        return response

    @action(detail=False, methods=["get"], url_path="export-students")
    def export_students(self, request):
        """
        Export all students for the current tenant to CSV.
        """
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="student_data_export.csv"'

        writer = csv.writer(response)
        headers = [
            "student_no",
            "names",
            "gender",
            "date_of_birth",
            "class_name",
            "parent_name",
            "parent_email",
            "parent_phone",
            "address",
            "status",
        ]
        writer.writerow(headers)

        from ..models import Student

        students = Student.objects.filter(school=request.user.school).select_related("current_class")

        for s in students:
            writer.writerow(
                [
                    s.student_no,
                    s.names,
                    s.gender,
                    s.dob,
                    s.current_class.name if s.current_class else "",
                    s.parent_name,
                    s.parent_email,
                    s.parent_phone,
                    s.address,
                    s.status,
                ]
            )

        return response
