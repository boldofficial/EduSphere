"""Conduct Entry ViewSet."""

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import ConductEntry
from ..serializers import ConductEntrySerializer
from .base import TenantViewSet


class ConductEntryViewSet(TenantViewSet):
    queryset = ConductEntry.objects.select_related("student", "recorded_by", "school").all()
    serializer_class = ConductEntrySerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        return qs

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school:
            serializer.save(school=school, recorded_by=self.request.user)
        else:
            serializer.save(recorded_by=self.request.user)
