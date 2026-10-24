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
from .base import IsSchoolStaff, TenantViewSet, is_school_staff, scope_to_learner

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
                settings_obj = (
                    SchoolSettings.objects.filter(school=school).only("current_session", "current_term").first()
                )
                if settings_obj:
                    session = session or settings_obj.current_session
                    term = term or settings_obj.current_term

        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        if student_id:
            qs = qs.filter(student__id=student_id)
        # One class at a time keeps score screens fast in big schools.
        class_id = self.request.query_params.get("class")
        if class_id:
            qs = qs.filter(student_class_id=class_id)

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

    @action(detail=False, methods=["post"], url_path="bulk-import")
    def bulk_import(self, request):
        """
        Import many subject scores at once (from the CSV upload in Grading).
        Body: {"session", "term", "mode": "upsert" | "create" | "update", "data": [{student_id, subject, ca1, ca2, exam}]}
        Each row is checked against its student's class: the section's score limits apply and the grade comes
        from the section's grading scale. Bad rows are reported and skipped; good rows are saved.
        """
        from django.db import transaction
        from rest_framework import serializers as drf_serializers

        from ..assessment import PARTS, check_scores, grade_for, grade_scale, section_assessment
        from ..models import Student, Subject

        if not is_school_staff(request.user):
            raise PermissionDenied("Only staff can import scores.")
        school = get_request_school(request)
        session, term = request.data.get("session"), request.data.get("term")
        mode = request.data.get("mode") or "upsert"
        rows = request.data.get("data")
        if not session or not term or not isinstance(rows, list):
            return Response({"detail": "session, term and data are required."}, status=400)
        if mode not in ("upsert", "create", "update"):
            return Response({"detail": "mode must be upsert, create or update."}, status=400)
        if len(rows) > 5000:
            return Response({"detail": "Import at most 5,000 rows at a time."}, status=400)

        students = {
            str(st.id): st
            for st in Student.objects.filter(
                school=school, id__in=[str(r.get("student_id")) for r in rows if isinstance(r, dict)]
            ).select_related("current_class__section__grading_scheme")
        }
        imported, errors, touched_classes, cards = 0, [], set(), {}
        for index, row in enumerate(rows, start=1):
            student = students.get(str(row.get("student_id"))) if isinstance(row, dict) else None
            subject_name = (
                " ".join(str((row or {}).get("subject") or "").split())[:100] if isinstance(row, dict) else ""
            )
            if not student or not subject_name:
                errors.append({"row": index, "error": "Unknown student or missing subject."})
                continue
            cls = student.current_class
            assessment = section_assessment(cls)
            try:
                check_scores(row, assessment)
            except drf_serializers.ValidationError as error:
                errors.append(
                    {"row": index, "error": str(error.detail[0] if isinstance(error.detail, list) else error.detail)}
                )
                continue
            values = {k: (float(row.get(k) or 0) if assessment[k]["enabled"] else 0) for k in PARTS}
            grade, remark = grade_for(sum(values.values()), grade_scale(cls))
            with transaction.atomic():
                card = cards.get(student.id)
                if card is None:
                    card, _ = ReportCard.objects.get_or_create(
                        school=school, student=student, session=session, term=term, defaults={"student_class": cls}
                    )
                    cards[student.id] = card
                subject, _ = Subject.objects.get_or_create(school=school, name=subject_name)
                score = SubjectScore.objects.filter(report_card=card, subject=subject).first()
                if (score and mode == "create") or (not score and mode == "update"):
                    errors.append(
                        {
                            "row": index,
                            "error": (
                                "Skipped: score already exists." if score else "Skipped: no existing score to update."
                            ),
                        }
                    )
                    continue
                score = score or SubjectScore(report_card=card, school=school, subject=subject)
                for key, value in values.items():
                    setattr(score, key, value)
                score.grade, score.comment = grade, remark
                score.save(skip_report_update=True)
            imported += 1
            if card.student_class_id:
                touched_classes.add(card.student_class_id)
        for card in cards.values():
            card.update_totals()
        for cls in Class.objects.filter(id__in=touched_classes):
            ReportCard.calculate_positions(school, cls, session, term)
        return Response({"imported": imported, "failed": len(errors), "errors": errors[:200]})

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

    @action(
        detail=False, methods=["get"], url_path="verify/(?P<hash>[^/.]+)", permission_classes=[permissions.AllowAny]
    )
    def verify(self, request, hash=None):
        """
        Public verification endpoint to check report card authenticity via hash.
        """
        try:
            instance = ReportCard.objects.select_related(
                "student", "student_class", "school", "student_class__class_teacher"
            ).get(verification_hash=hash)

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
                "teacher_name": (
                    instance.student_class.class_teacher.name
                    if instance.student_class and instance.student_class.class_teacher
                    else "Internal Authority"
                ),
            }
            return Response(data)
        except ReportCard.DoesNotExist:
            return Response({"error": "Invalid verification hash"}, status=404)


class SubjectScoreViewSet(TenantViewSet):
    queryset = SubjectScore.objects.select_related(
        "report_card__student", "report_card__student_class", "subject", "school"
    ).all()
    serializer_class = SubjectScoreSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_school_staff(user):
            return qs
        return scope_to_learner(qs, user, "report_card__student").filter(report_card__is_passed=True)


class BroadsheetView(viewsets.ViewSet):
    """
    Broadsheet / Master Result Sheet — aggregates SubjectScores across all subjects
    for a class in a given session and term. Returns a pivoted table.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolStaff]

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
