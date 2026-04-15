"""
Query Optimization Utilities for Django Views

Provides decorators and mixins to optimize database queries.
"""

from functools import wraps
from django.db.models import QuerySet


# Common prefetch_related configurations
PREFETCH_CONFIGS = {
    "student_list": [
        "student_class",
        "student_class__school",
    ],
    "teacher_list": [
        "teacher_school",
    ],
    "payment_list": [
        "student",
        "student__student_class",
    ],
    "fee_list": [
        "class_id",
        "fee_item",
    ],
    "score_list": [
        "student",
        "subject",
    ],
    "attendance_list": [
        "student",
        "session",
    ],
}


# Common select_related configurations
SELECT_CONFIGS = {
    "student_detail": ["student_class", "student_class__school"],
    "teacher_detail": ["teacher_school"],
    "payment_detail": ["student", "student__student_class"],
    "fee_detail": ["class_id", "fee_item"],
    "score_detail": ["student", "subject"],
}


def apply_query_optimization(
    queryset: QuerySet, optimization_type: str = "default"
) -> QuerySet:
    """
    Apply query optimizations based on type.

    Args:
        queryset: Django queryset to optimize
        optimization_type: Type of optimization to apply

    Returns:
        Optimized queryset
    """
    select_config = SELECT_CONFIGS.get(optimization_type, [])
    prefetch_config = PREFETCH_CONFIGS.get(optimization_type, [])

    if select_config:
        queryset = queryset.select_related(*select_config)

    if prefetch_config:
        queryset = queryset.prefetch_related(*prefetch_config)

    return queryset


def with_pagination(page_size: int = 50, max_page_size: int = 100):
    """
    Decorator to add standardized pagination.

    Usage:
        @with_pagination(page_size=20)
        def list(self, request, *args, **kwargs):
            ...
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Get page size from query params, with limits
            try:
                requested_size = int(request.query_params.get("page_size", page_size))
                size = min(max(1, requested_size), max_page_size)
            except (ValueError, TypeError):
                size = page_size

            # Set pagination on view
            self.pagination_class.page_size = size

            return func(self, request, *args, **kwargs)

        return wrapper

    return decorator


def with_query_cache(timeout: int = 300):
    """
    Decorator to cache query results.

    Usage:
        @with_query_cache(timeout=600)
        def list(self, request, *args, **kwargs):
            ...
    """

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            from django.core.cache import cache

            # Build cache key from request
            cache_key = f"query:{request.path}:{request.query_params}"

            # Try cache first
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

            # Execute query
            result = func(self, request, *args, **kwargs)

            # Cache result
            if hasattr(result, "data"):
                cache.set(cache_key, result, timeout)

            return result

        return wrapper

    return decorator


def with_tenant_filter(view_func):
    """
    Decorator to ensure tenant filtering is properly applied.
    Adds safety check for tenant isolation.
    """

    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        from core.tenant_utils import get_request_school
        from rest_framework.exceptions import PermissionDenied

        school = get_request_school(request)

        # Ensure school is always required for non-super-admin views
        if not school and not getattr(request.user, "is_superadmin", False):
            raise PermissionDenied("Tenant context required")

        return view_func(self, request, *args, **kwargs)

    return wrapper


class OptimizedViewSetMixin:
    """
    Mixin to automatically apply query optimizations to ViewSets.

    Usage:
        class StudentViewSet(OptimizedViewSetMixin, ModelViewSet):
            queryset = Student.objects.all()
            optimization_type = 'student_list'
    """

    optimization_type = "default"
    cache_timeout = 300

    def get_queryset(self):
        qs = super().get_queryset()
        return apply_query_optimization(qs, self.optimization_type)

    def get_cache_key(self):
        """Build cache key for this view's responses"""
        model = self.queryset.model.__name__
        return f"viewset:{model}:list"

    def invalidate_cache(self):
        """Invalidate cache on model changes"""
        from django.core.cache import cache

        try:
            cache.delete_pattern(f"viewset:{self.queryset.model.__name__}:*")
        except Exception:
            pass


def get_count_optimized(queryset: QuerySet) -> int:
    """
    Get count without loading all objects.
    Uses .count() for efficiency.
    """
    return queryset.count()


def get_exists_optimized(queryset: QuerySet) -> bool:
    """
    Check existence without loading objects.
    Uses .exists() for efficiency.
    """
    return queryset.exists()
