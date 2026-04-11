"""SchoolEvent ViewSet."""

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import SchoolEvent
from ..serializers import SchoolEventSerializer
from .base import TenantViewSet


class SchoolEventViewSet(TenantViewSet):
    queryset = SchoolEvent.objects.select_related("created_by", "school").all()
    serializer_class = SchoolEventSerializer
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school:
            serializer.save(school=school, created_by=self.request.user)
        else:
            if self.request.user.is_superuser:
                serializer.save(created_by=self.request.user)
