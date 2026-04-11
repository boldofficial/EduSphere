"""GradingScheme and GradeRange ViewSets."""

from core.pagination import StandardPagination

from ..models import GradeRange, GradingScheme
from ..serializers import GradeRangeSerializer, GradingSchemeSerializer
from .base import TenantViewSet


class GradingSchemeViewSet(TenantViewSet):
    queryset = GradingScheme.objects.select_related("school").prefetch_related("ranges").all()
    serializer_class = GradingSchemeSerializer
    pagination_class = StandardPagination


class GradeRangeViewSet(TenantViewSet):
    queryset = GradeRange.objects.select_related("scheme", "school").all()
    serializer_class = GradeRangeSerializer
    pagination_class = StandardPagination
