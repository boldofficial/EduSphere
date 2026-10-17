"""Conduct Entry ViewSet."""

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import ConductEntry
from ..serializers import ConductEntrySerializer
from core.permissions import EveryoneReadStaffWrite

from .base import TenantViewSet, scope_to_learner


class ConductEntryViewSet(TenantViewSet):
    queryset = ConductEntry.objects.select_related("student", "recorded_by", "school").all()
    serializer_class = ConductEntrySerializer
    pagination_class = StandardPagination
    permission_classes = [EveryoneReadStaffWrite]

    def get_queryset(self):
        # Students see their own record, parents their children's, teachers their classes'.
        return scope_to_learner(super().get_queryset(), self.request.user)

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school:
            serializer.save(school=school, recorded_by=self.request.user)
        else:
            serializer.save(recorded_by=self.request.user)
