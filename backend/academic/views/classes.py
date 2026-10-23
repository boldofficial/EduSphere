"""Class, Subject, and SubjectTeacher ViewSets."""

from django.http import FileResponse
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import Class, Subject, SubjectTeacher
from ..serializers import ClassSerializer, SubjectSerializer, SubjectTeacherSerializer
from ..utils import BroadsheetPDFGenerator
from .base import TenantViewSet


class SubjectViewSet(TenantViewSet):
    queryset = Subject.objects.order_by("name").all()
    serializer_class = SubjectSerializer
    pagination_class = StandardPagination


class ClassViewSet(TenantViewSet):
    queryset = (
        Class.objects.select_related("class_teacher", "school", "section")
        .prefetch_related("subjects")
        .order_by("level_order", "name")
    )
    serializer_class = ClassSerializer
    pagination_class = StandardPagination

    @action(detail=True, methods=["get"], url_path="export-broadsheet-pdf")
    def export_broadsheet_pdf(self, request, pk=None):
        """
        Export the master broadsheet for a class as a PDF.
        Query params: session, term
        """
        instance = self.get_object()
        session = request.query_params.get("session")
        term = request.query_params.get("term")

        if not session or not term:
            return Response({"error": "session and term are required query parameters"}, status=400)

        school = get_request_school(request)

        generator = BroadsheetPDFGenerator(school, instance, session, term)
        pdf_buffer = generator.generate()

        filename = (
            f"Broadsheet_{instance.name.replace(' ', '_')}_{session.replace('/', '-')}_{term.replace(' ', '_')}.pdf"
        )
        return FileResponse(pdf_buffer, as_attachment=True, filename=filename, content_type="application/pdf")

    @action(detail=True, methods=["get", "post"], url_path="bulk-export-report-cards-pdf")
    def bulk_export_report_cards_pdf(self, request, pk=None):
        """
        Queue a PDF of every report card in the class (query params: session, term).
        Returns 202 {job_id}; poll `export-jobs/<job_id>/`, then download from `export-jobs/<job_id>/download/`.
        A whole class can take minutes, longer than a web request may run.
        """
        from core.export_jobs import create_job

        from ..tasks import export_class_report_cards

        instance = self.get_object()
        session = request.query_params.get("session")
        term = request.query_params.get("term")
        if not session or not term:
            return Response({"detail": "session and term are required query parameters"}, status=400)

        filename = f"Reports_{instance.name.replace(' ', '_')}_{session.replace('/', '-')}_{term.replace(' ', '_')}.pdf"
        job_id = create_job(instance.school_id, request.user.id, filename)
        export_class_report_cards.delay(job_id, instance.pk, instance.school_id, session, term)
        return Response({"job_id": job_id, "status": "pending"}, status=202)

    @action(detail=False, methods=["get"], url_path=r"export-jobs/(?P<job_id>[0-9a-f]{32})")
    def export_job_status(self, request, job_id=None):
        from core.export_jobs import job_for_request

        job = job_for_request(job_id, request)
        if not job:
            return Response({"detail": "Export not found or expired."}, status=404)
        return Response({"job_id": job_id, "status": job["status"], "error": job.get("error")})

    @action(detail=False, methods=["get"], url_path=r"export-jobs/(?P<job_id>[0-9a-f]{32})/download")
    def export_job_download(self, request, job_id=None):
        from django.core.files.storage import default_storage

        from core.export_jobs import job_for_request

        job = job_for_request(job_id, request)
        if not job or job.get("status") != "done":
            return Response({"detail": "Export is not ready."}, status=404)
        return FileResponse(
            default_storage.open(job["path"], "rb"),
            as_attachment=True,
            filename=job["filename"],
            content_type="application/pdf",
        )


class SubjectTeacherViewSet(TenantViewSet):
    queryset = SubjectTeacher.objects.select_related("teacher", "student_class", "school").all()
    serializer_class = SubjectTeacherSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()

        # Filter by teacher if user is a teacher
        if self.request.user.role == "TEACHER" and hasattr(self.request.user, "teacher_profile"):
            qs = qs.filter(teacher=self.request.user.teacher_profile)

        # Optional filters
        class_id = self.request.query_params.get("class_id")
        teacher_id = self.request.query_params.get("teacher_id")
        session = self.request.query_params.get("session")

        if class_id:
            qs = qs.filter(student_class_id=class_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if session:
            qs = qs.filter(session=session)

        return qs
