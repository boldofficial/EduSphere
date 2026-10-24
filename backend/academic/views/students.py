"""Student-related ViewSets: StudentViewSet, StudentHistoryViewSet, StudentAchievementViewSet."""

from django.db import models, transaction
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import LargePagination, StandardPagination
from core.tenant_utils import get_request_school

from ..models import Class, ReportCard, Student, StudentAchievement, StudentHistory
from ..serializers import StudentAchievementSerializer, StudentHistorySerializer, StudentSerializer
from rest_framework.exceptions import PermissionDenied

from .base import TenantViewSet, scope_to_learner
from .student_profile import build_student_profile


class StudentViewSet(TenantViewSet):
    queryset = Student.objects.select_related("user", "current_class", "school").all()
    serializer_class = StudentSerializer
    pagination_class = LargePagination

    def get_queryset(self):
        qs = scope_to_learner(super().get_queryset(), self.request.user, student_path="pk")
        # Latest report-card trend as a subquery, instead of one query per student in the serializer.
        latest_trend = (
            ReportCard.objects.filter(student=models.OuterRef("pk"))
            .order_by("-created_at")
            .values("performance_trend")[:1]
        )
        qs = qs.annotate(latest_performance_trend=models.Subquery(latest_trend))
        class_id = self.request.query_params.get("class")
        search = self.request.query_params.get("search")

        if class_id:
            qs = qs.filter(current_class_id=class_id)
        if search:
            qs = qs.filter(models.Q(names__icontains=search) | models.Q(student_no__icontains=search))
        return qs

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school and not school.has_student_capacity():
            raise PermissionDenied(
                "Your plan's student limit has been reached. Upgrade your plan to add more students."
            )
        super().perform_create(serializer)

    def _can_manage_logins(self, request):
        from core.permissions import FINANCE, role_of

        return role_of(request.user) in FINANCE  # admins and office staff

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """New temporary password for one student (shown once); they choose their own at next sign-in."""
        from ..student_onboarding import ensure_login

        if not self._can_manage_logins(request):
            return Response({"detail": "Only admins and office staff can reset student passwords."}, status=403)
        student = self.get_object()
        if not student.student_no:
            return Response({"detail": "Give this student an admission number first."}, status=400)
        password = ensure_login(student)
        return Response({"student_no": student.student_no, "names": student.names, "password": password})

    @action(detail=False, methods=["post"], url_path="issue-logins")
    def issue_logins(self, request):
        """
        Sign-in accounts for a class at once (e.g. existing students who never had one).
        Body: {"class_id", "only_missing": true}. Returns login slips; passwords are shown once.
        """
        from ..models import Class
        from ..student_onboarding import ensure_login

        if not self._can_manage_logins(request):
            return Response({"detail": "Only admins and office staff can issue student logins."}, status=403)
        school = get_request_school(request)
        cls = Class.objects.filter(school=school, pk=request.data.get("class_id")).first()
        if not cls:
            return Response({"detail": "Choose a class."}, status=400)
        only_missing = str(request.data.get("only_missing", "true")).lower() != "false"
        students = Student.objects.filter(school=school, current_class=cls, status="active").exclude(student_no="")
        if only_missing:
            students = students.filter(user__isnull=True)
        slips = [
            {"student_no": st.student_no, "names": st.names, "class_name": cls.name, "password": ensure_login(st)}
            for st in students.select_related("user", "school").order_by("names")[:500]
        ]
        return Response({"count": len(slips), "slips": slips})

    @action(detail=True, methods=["get"], url_path="profile")
    def profile(self, request, pk=None):
        """One student's academics, attendance, fees and conduct for ?session=&term= (default: current)."""
        student = self.get_object()  # role scoping from get_queryset applies
        return Response(
            build_student_profile(
                student,
                session=request.query_params.get("session"),
                term=request.query_params.get("term"),
            )
        )

    @action(detail=False, methods=["post"], url_path="bulk-promote")
    def bulk_promote(self, request):
        """
        Promote or repeat multiple students at once.
        Body: { "promotions": { "student_id": "next_class_id", ... } }
        """
        promotions = request.data.get("promotions", {})
        if not promotions:
            return Response({"error": "No promotions provided"}, status=400)

        school = get_request_school(request)
        if not school and not request.user.is_superuser:
            return Response({"error": "School context not found"}, status=403)

        # 1. Fetch all students in one query
        student_ids = list(promotions.keys())
        students = Student.objects.filter(pk__in=student_ids).select_related("school")

        # 2. Fetch all unique target classes in one query
        target_class_ids = set(cid for cid in promotions.values() if cid != "graduate")
        classes = {str(c.id): c for c in Class.objects.filter(pk__in=target_class_ids)}

        updated_students = []
        for student in students:
            # Check tenant isolation
            if school and student.school != school:
                continue

            next_class_id = str(promotions.get(str(student.id)))

            if next_class_id == "graduate":
                student.current_class = None
                updated_students.append(student)
            elif next_class_id in classes:
                target_class = classes[next_class_id]
                # Security: Ensure class belongs to same school
                if school and target_class.school_id != school.id:
                    continue
                student.current_class = target_class
                updated_students.append(student)

        # 3. Perform bulk update in a single transaction
        if updated_students:
            with transaction.atomic():
                Student.objects.bulk_update(updated_students, ["current_class"])

        return Response({"success": True, "updated": len(updated_students)})

    @action(detail=False, methods=["post"], url_path="trigger-auto-promotion")
    def trigger_auto_promotion(self, request):
        """
        Trigger the automated promotion task for students who meet the threshold.
        Body: { "session": "2024/2025", "term": "Third Term" }
        """
        session = request.data.get("session")
        term = request.data.get("term")

        if not session or not term:
            return Response({"error": "session and term are required"}, status=400)

        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=403)

        from ..tasks import promote_students_task

        task = promote_students_task.delay(school.id, session, term)

        return Response({"message": "Automated promotion task started.", "task_id": task.id}, status=202)


class StudentHistoryViewSet(TenantViewSet):
    queryset = StudentHistory.objects.select_related("student", "student_class").all()
    serializer_class = StudentHistorySerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = scope_to_learner(super().get_queryset(), self.request.user)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student__id=student_id)
        return qs


class StudentAchievementViewSet(TenantViewSet):
    queryset = StudentAchievement.objects.select_related("student").all()
    serializer_class = StudentAchievementSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = scope_to_learner(super().get_queryset(), self.request.user)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student__id=student_id)
        return qs
