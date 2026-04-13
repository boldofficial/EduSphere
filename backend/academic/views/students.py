"""Student-related ViewSets: StudentViewSet, StudentHistoryViewSet, StudentAchievementViewSet."""

from django.db import models, transaction
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import LargePagination, StandardPagination
from core.tenant_utils import get_request_school

from ..models import Class, Student, StudentAchievement, StudentHistory
from ..serializers import StudentAchievementSerializer, StudentHistorySerializer, StudentSerializer
from .base import TenantViewSet


class StudentViewSet(TenantViewSet):
    queryset = Student.objects.select_related("user", "current_class", "school").all()
    serializer_class = StudentSerializer
    pagination_class = LargePagination

    def get_queryset(self):
        import logging
        logger = logging.getLogger(__name__)
        qs = super().get_queryset()
        logger.info(f"[StudentViewSet] User={self.request.user}, Tenant={getattr(self.request, 'tenant', 'NONE')}, "
                     f"UserSchool={getattr(self.request.user, 'school', 'NONE')}, QS count={qs.count()}")
        class_id = self.request.query_params.get("class")
        search = self.request.query_params.get("search")

        if class_id:
            qs = qs.filter(current_class_id=class_id)
        if search:
            qs = qs.filter(models.Q(names__icontains=search) | models.Q(student_no__icontains=search))
        return qs

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

        updated_count = 0
        with transaction.atomic():
            for student_id, next_class_id in promotions.items():
                try:
                    student = Student.objects.get(pk=student_id)
                    # Check tenant isolation if not superuser
                    if school and student.school != school:
                        continue

                    if next_class_id == "graduate":
                        # Handle graduation logic if needed (e.g. set class to null and status to graduated)
                        student.current_class = None
                        # student.is_active = False # or similar
                    else:
                        target_class_qs = Class.objects.filter(pk=next_class_id)
                        if school:
                            target_class_qs = target_class_qs.filter(school=school)
                        target_class = target_class_qs.get()
                        student.current_class = target_class

                    student.save()
                    updated_count += 1
                except (Student.DoesNotExist, Class.DoesNotExist):
                    continue

        return Response({"success": True, "updated": updated_count})

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
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student__id=student_id)
        return qs


class StudentAchievementViewSet(TenantViewSet):
    queryset = StudentAchievement.objects.select_related("student").all()
    serializer_class = StudentAchievementSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student__id=student_id)
        return qs
