"""ReportCard, SubjectScore, and BroadsheetView."""

import logging

from django.http import FileResponse
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school
from schools.models import SchoolSettings

from ..models import (
    Class,
    ReportCard,
    SubjectScore,
)
from ..serializers import ReportCardSerializer, SubjectScoreSerializer
from ..utils import ReportCardPDFGenerator
from .base import TenantViewSet

logger = logging.getLogger(__name__)


def _is_truthy(value):
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


class ReportCardViewSet(TenantViewSet):
    queryset = (
        ReportCard.objects.select_related("student", "student_class", "school")
        .prefetch_related("scores__subject")
        .all()
    )
    serializer_class = ReportCardSerializer
    pagination_class = StandardPagination

    @action(detail=True, methods=["get"], url_path="export-pdf")
    def export_pdf(self, request, pk=None):
        """
        Export a single student report card as a PDF.
        """
        instance = self.get_object()
        school = get_request_school(request)
        user = request.user

        # Students/parents can only download published report cards.
        if user.role in ("STUDENT", "PARENT") and not instance.is_passed:
            raise PermissionDenied("This report card has not been published yet.")

        generator = ReportCardPDFGenerator(school)
        pdf_buffer = generator.generate_single(instance)

        filename = f"Report_{instance.student.names.replace(' ', '_')}_{instance.session.replace('/', '-')}.pdf"
        return FileResponse(pdf_buffer, as_attachment=True, filename=filename, content_type="application/pdf")

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # 1. Security: Restrict Students/Parents to their own records
        if user.role == "STUDENT":
            qs = qs.filter(student__user=user, is_passed=True)
        elif user.role == "PARENT":
            # Assuming Parent is linked to Student via email/phone or explicit link
            # For now, filtering by parent_email match if simple link
            qs = qs.filter(student__parent_email=user.email, is_passed=True)

        # 2. Filters for "Past Report Cards" feature
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        student_id = self.request.query_params.get("student")
        include_all_periods = _is_truthy(self.request.query_params.get("include_all_periods"))

        if not include_all_periods:
            school = get_request_school(self.request)
            if school:
                settings_obj = SchoolSettings.objects.filter(school=school).only("current_session", "current_term").first()
                if settings_obj:
                    session = session or settings_obj.current_session
                    term = term or settings_obj.current_term

        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        if student_id:
            qs = qs.filter(student__id=student_id)

        return qs

    @action(detail=True, methods=["post"], url_path="suggest-remark")
    def suggest_remark(self, request, pk=None):
        """
        AI-powered remark suggestion based on student scores.
        Delegates to ReportCardAIService for processing.
        """
        from ..services.ai_service import ReportCardAIService

        report_card = self.get_object()
        remark, performance_data = ReportCardAIService.suggest_remark(report_card)

        return Response({"suggestion": remark, "data": performance_data})

    @action(detail=True, methods=["post"], url_path="compute-trend")
    def compute_trend(self, request, pk=None):
        """
        Manually trigger performance trend computation for a student.
        """
        report_card = self.get_object()
        report_card.calculate_trend(save=True)
        return Response({"success": True, "trend": report_card.performance_trend})

    @action(detail=False, methods=["post"], url_path="recalculate-positions")
    def recalculate_positions(self, request):
        """
        Recalculate class positions for all students in a given class/session/term.
        Body: { "class_id": "...", "session": "...", "term": "..." }
        """
        class_id = request.data.get("class_id")
        session = request.data.get("session")
        term = request.data.get("term")
        school = get_request_school(request)

        if not all([class_id, session, term, school]):
            return Response({"error": "class_id, session, and term are required"}, status=400)

        try:
            student_class = Class.objects.get(id=class_id, school=school)
        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=404)

        ReportCard.calculate_positions(school, student_class, session, term)
        count = ReportCard.objects.filter(
            school=school, student_class=student_class, session=session, term=term
        ).count()
        return Response({"success": True, "message": f"Positions recalculated for {count} students"})

    @action(detail=False, methods=["get"], url_path="verify/(?P<hash>[^/.]+)", permission_classes=[permissions.AllowAny])
    def verify(self, request, hash=None):
        """
        Public verification endpoint to check report card authenticity via hash.
        """
        try:
            instance = ReportCard.objects.select_related("student", "student_class", "school", "student_class__class_teacher").get(verification_hash=hash)
            
            # Prepare public verification data
            data = {
                "student_name": instance.student.names,
                "student_no": instance.student.student_no,
                "class_name": instance.student_class.name if instance.student_class else "N/A",
                "session": instance.session,
                "term": instance.term,
                "average": instance.average,
                "is_passed": instance.is_passed,
                "school_name": instance.school.name,
                "verified_at": instance.updated_at.isoformat() if hasattr(instance, "updated_at") else None,
                "teacher_name": instance.student_class.class_teacher.name if instance.student_class and instance.student_class.class_teacher else "Internal Authority"
            }
            return Response(data)
        except ReportCard.DoesNotExist:
            return Response({"error": "Invalid verification hash"}, status=404)


class SubjectScoreViewSet(TenantViewSet):
    queryset = SubjectScore.objects.select_related("report_card__student", "report_card__student_class", "subject", "school").all()
    serializer_class = SubjectScoreSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(report_card__student=user.student_profile)
        return qs


class BroadsheetView(viewsets.ViewSet):
    """
    Broadsheet / Master Result Sheet — aggregates SubjectScores across all subjects
    for a class in a given session and term. Returns a pivoted table.
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        class_id = request.query_params.get("class_id")
        session = request.query_params.get("session")
        term = request.query_params.get("term")

        if not all([class_id, session, term]):
            return Response({"error": "class_id, session, and term are required"}, status=400)

        scores = (
            SubjectScore.objects.filter(
                school=school,
                report_card__student__current_class_id=class_id,
                report_card__session=session,
                report_card__term=term,
            )
            .select_related("report_card__student", "subject")
            .order_by("report_card__student__names", "subject__name")
        )

        # Pivot: { student_id: { name, subjects: { subject_name: { ca, exam, total } }, grand_total } }
        broadsheet = {}
        all_subjects = set()

        for score in scores:
            student = score.report_card.student
            sid = str(student.id)
            subject_name = score.subject.name
            all_subjects.add(subject_name)

            if sid not in broadsheet:
                broadsheet[sid] = {
                    "student_id": sid,
                    "student_name": student.names if hasattr(student, "names") else str(student),
                    "student_no": getattr(student, "student_no", ""),
                    "subjects": {},
                    "grand_total": 0,
                }

            total = float(score.total or 0)
            broadsheet[sid]["subjects"][subject_name] = {
                "ca": float((score.ca1 or 0) + (score.ca2 or 0)),
                "exam": float(score.exam or 0),
                "total": total,
                "grade": getattr(score, "grade", ""),
            }
            broadsheet[sid]["grand_total"] += total

        # Sort students by name and subjects alphabetically
        rows = sorted(broadsheet.values(), key=lambda x: x["student_name"])
        subjects = sorted(all_subjects)

        # Calculate position (rank by grand_total descending)
        sorted_by_total = sorted(rows, key=lambda x: x["grand_total"], reverse=True)
        for idx, row in enumerate(sorted_by_total, 1):
            row["position"] = idx

        return Response(
            {
                "subjects": subjects,
                "students": rows,
                "class_id": class_id,
                "session": session,
                "term": term,
            }
        )
