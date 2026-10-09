"""Teacher ViewSet."""

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import Teacher
from rest_framework import permissions

from core.permissions import ADMIN, EveryoneReadAdminWrite, role_of

from ..serializers import TeacherPublicSerializer, TeacherSerializer
from .base import TenantViewSet


class TeacherViewSet(TenantViewSet):
    queryset = Teacher.objects.select_related("user", "school").all()
    permission_classes = [permissions.IsAuthenticated, EveryoneReadAdminWrite]

    def get_serializer_class(self):
        # Pay, bank, pension and contact details are admin-only.
        if role_of(self.request.user) in ADMIN:
            return TeacherSerializer
        return TeacherPublicSerializer

    serializer_class = TeacherSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter based on endpoint, unless 'all' is requested
        if self.request.query_params.get("all") == "true":
            return qs

        if "staff" in self.request.path:
            return qs.filter(staff_type="NON_ACADEMIC")
        return qs.filter(staff_type="ACADEMIC")

    def perform_create(self, serializer):
        # Determine staff_type from path
        staff_type = "NON_ACADEMIC" if "staff" in self.request.path else "ACADEMIC"

        school = get_request_school(self.request, allow_super_admin_tenant=True)
        serializer.save(school=school, staff_type=staff_type)
        self.invalidate_cache()
