"""
Base classes and permissions shared across all academic views.
"""

import logging

from django.db import models
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from core.cache_utils import CachingMixin
from core.tenant_utils import get_request_school

logger = logging.getLogger(__name__)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Write operations restricted to SCHOOL_ADMIN, SUPER_ADMIN, or superusers.
    TEACHER role gets write access too (they need to create scores, attendance etc).
    STUDENT and other roles are read-only.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ("SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER") or request.user.is_superuser


STAFF_ROLES = ("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STAFF")


def is_school_staff(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role in STAFF_ROLES))


def teacher_class_ids(user):
    """Classes a teacher is responsible for: class teacher or subject teacher."""
    from academic.models import Class

    teacher = getattr(user, "teacher_profile", None)
    if not teacher:
        return []
    return list(
        Class.objects.filter(models.Q(class_teacher=teacher) | models.Q(subject_teachers__teacher=teacher))
        .values_list("id", flat=True)
        .distinct()
    )


def scope_to_learner(qs, user, student_path="student"):
    """
    Limit a student-linked queryset by role: admins/staff see everything, teachers see students in
    their own classes, students see themselves and parents see their children.
    """
    prefix = f"{student_path}__" if student_path != "pk" else ""
    if user.is_superuser or user.role in ("SUPER_ADMIN", "SCHOOL_ADMIN", "STAFF"):
        return qs
    if user.role == "TEACHER":
        return qs.filter(**{f"{prefix}current_class_id__in": teacher_class_ids(user)})
    if user.role == "STUDENT":
        student = getattr(user, "student_profile", None)
        return qs.filter(**{student_path: student.pk}) if student else qs.none()
    if user.role == "PARENT":
        return qs.filter(**{f"{prefix}parent_email__iexact": user.email}) if user.email else qs.none()
    return qs.none()


class IsSchoolStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_school_staff(request.user)


class TenantViewSet(CachingMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def _enforce_related_school(self, value, school, field_name="field"):
        if value is None or school is None:
            return

        if hasattr(value, "school"):
            related_school = getattr(value, "school", None)
            if related_school and related_school != school:
                raise PermissionDenied(f"{field_name} must belong to your school.")
            return

        if isinstance(value, dict):
            for key, item in value.items():
                self._enforce_related_school(item, school, f"{field_name}.{key}")
            return

        if isinstance(value, (list, tuple, set)):
            for index, item in enumerate(value):
                self._enforce_related_school(item, school, f"{field_name}[{index}]")

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()

        if user.is_superuser:
            school = get_request_school(self.request, allow_super_admin_tenant=True)
            return self.queryset.filter(school=school) if school else self.queryset.all()

        school = get_request_school(self.request, allow_super_admin_tenant=False)
        if school:
            return self.queryset.filter(school=school)

        return self.queryset.none()

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        for field_name, value in serializer.validated_data.items():
            self._enforce_related_school(value, school, field_name)
        if school:
            serializer.save(school=school)
        elif self.request.user.is_superuser:
            serializer.save()
        else:
            raise PermissionDenied("School context not found.")
        self.invalidate_cache()

    def perform_update(self, serializer):
        instance = serializer.instance
        user = self.request.user
        # Tenant isolation: verify the object belongs to the user's school
        if not user.is_superuser and hasattr(instance, "school"):
            user_school = get_request_school(self.request, allow_super_admin_tenant=False)
            if user_school and instance.school != user_school:
                raise PermissionDenied("You cannot modify records belonging to another school.")
            for field_name, value in serializer.validated_data.items():
                self._enforce_related_school(value, user_school, field_name)
        super().perform_update(serializer)
        self.invalidate_cache()

    def perform_destroy(self, instance):
        user = self.request.user
        # Tenant isolation: verify the object belongs to the user's school
        if not user.is_superuser and hasattr(instance, "school"):
            user_school = get_request_school(self.request, allow_super_admin_tenant=False)
            if user_school and instance.school != user_school:
                raise PermissionDenied("You cannot delete records belonging to another school.")
        super().perform_destroy(instance)
        self.invalidate_cache()
