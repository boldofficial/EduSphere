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
        """
        Generate and download the CSV template for bulk student import.
        """
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="student_import_template.csv"'

        writer = csv.writer(response)
        # Headers matching StudentSerializer expectations (mostly)
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
            "password",
        ]
        writer.writerow(headers)

        # Add a sample row to guide the user
        writer.writerow(
            [
                "ST2024001",
                "John Doe",
                "Male",
                "2010-05-15",
                "JSS 1",
                "Mr. Doe",
                "parent@example.com",
                "08012345678",
                "123 Main St, Lagos",
                "securepass123",
            ]
        )

        return response

    @action(detail=False, methods=["post"], url_path="import-students")
    def import_students(self, request):
        """
        Queue a bulk student import from a CSV file. Returns 202 {job_id}; poll `jobs/<job_id>/`.
        Each row creates a login (password hashing), so a few hundred rows outlast a web request.
        """
        from data_import.models import ImportJob

        from ..tasks import import_students_csv

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        if not file_obj.name.lower().endswith(".csv"):
            return Response({"detail": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST)
        if file_obj.size > MAX_IMPORT_BYTES:
            return Response({"detail": "CSV is too large (max 5 MB)."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            text = file_obj.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response({"detail": "Save the CSV as UTF-8 and try again."}, status=status.HTTP_400_BAD_REQUEST)

        rows = sum(1 for _ in csv.DictReader(text.splitlines()))
        job = ImportJob.objects.create(
            school=request.user.school,
            import_type="students",
            file_name=file_obj.name[:255],
            created_by=request.user.username,
            total_rows=rows,
        )
        import_students_csv.delay(job.pk, request.user.pk, text)
        return Response({"job_id": job.pk, "status": "pending", "total_rows": rows}, status=status.HTTP_202_ACCEPTED)

    @action(detail=False, methods=["get"], url_path=r"jobs/(?P<job_id>[0-9]+)")
    def import_job(self, request, job_id=None):
        from data_import.models import ImportJob

        job = ImportJob.objects.filter(pk=job_id, school=request.user.school).first()
        if not job:
            return Response({"detail": "Import not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "job_id": job.pk,
                "status": job.status,
                "total_rows": job.total_rows,
                "processed_rows": job.processed_rows,
                "success_count": job.success_rows,
                "error_count": job.failed_rows,
                "errors": job.errors[:200],
            }
        )

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
