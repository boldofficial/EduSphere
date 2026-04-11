"""Lesson ViewSet."""

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import Lesson
from ..serializers import LessonSerializer
from .base import TenantViewSet


class LessonViewSet(TenantViewSet):
    queryset = Lesson.objects.select_related("subject", "student_class", "teacher", "school").all()
    serializer_class = LessonSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student_class=user.student_profile.current_class)
        return qs

    def perform_create(self, serializer):
        # Assign teacher profile automatically if current user is a teacher
        teacher = None
        if hasattr(self.request.user, "teacher_profile"):
            teacher = self.request.user.teacher_profile

        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school:
            serializer.save(school=school, teacher=teacher)
        else:
            serializer.save(teacher=teacher)
