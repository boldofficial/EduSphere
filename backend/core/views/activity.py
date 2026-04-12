"""Activity log views."""

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import GlobalActivityLog
from ..serializers import GlobalActivityLogSerializer


class GlobalActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view of activity logs for the current school.
    Restricted to staff and admins.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = GlobalActivityLogSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        user = self.request.user
        if user.role not in ("SUPER_ADMIN", "SCHOOL_ADMIN", "STAFF"):
            return GlobalActivityLog.objects.none()

        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if not school:
            return GlobalActivityLog.objects.none()

        qs = GlobalActivityLog.objects.filter(school=school).order_by("-created_at")

        action_filter = self.request.query_params.get("action")
        if action_filter:
            qs = qs.filter(action=action_filter)

        search_query = self.request.query_params.get("q")
        if search_query:
            qs = qs.filter(Q(description__icontains=search_query) | Q(user__username__icontains=search_query))

        return qs
