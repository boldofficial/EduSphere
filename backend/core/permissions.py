"""
Role-based access shared by every module.

Roles: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STAFF, STUDENT, PARENT. Superusers count as SUPER_ADMIN.
Tenant isolation (which school) is handled separately by get_request_school / TenantViewSet;
these classes only decide which roles may read or write a module.
"""

from rest_framework import permissions

ADMIN = frozenset({"SUPER_ADMIN", "SCHOOL_ADMIN"})
FINANCE = ADMIN | {"STAFF"}
STAFF = ADMIN | {"TEACHER", "STAFF"}
LEARNERS = frozenset({"STUDENT", "PARENT"})
EVERYONE = STAFF | LEARNERS


def role_of(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return "SUPER_ADMIN"
    return (getattr(user, "role", "") or "").upper()


def is_learner(user):
    return role_of(user) in LEARNERS


class RolePermission(permissions.BasePermission):
    """
    Subclass via role_permission(). A view may also list `learner_actions`: custom actions that
    students/parents may call even when they cannot otherwise write (e.g. submitting a quiz).
    """

    read_roles = frozenset()
    write_roles = frozenset()

    def has_permission(self, request, view):
        role = role_of(request.user)
        if role is None:
            return False
        if getattr(view, "action", None) in getattr(view, "learner_actions", ()) and role in LEARNERS:
            return True
        allowed = self.read_roles if request.method in permissions.SAFE_METHODS else self.write_roles
        return role in allowed


def role_permission(read, write, name="ModulePermission"):
    return type(name, (RolePermission,), {"read_roles": frozenset(read), "write_roles": frozenset(write)})


# Common module policies
AdminOnly = role_permission(ADMIN, ADMIN, "AdminOnly")
FinanceOnly = role_permission(FINANCE, FINANCE, "FinanceOnly")
StaffReadAdminWrite = role_permission(STAFF, ADMIN, "StaffReadAdminWrite")
StaffOnly = role_permission(STAFF, STAFF, "StaffOnly")
OperationsStaff = role_permission(STAFF, FINANCE, "OperationsStaff")  # teachers read, admin/staff write
EveryoneReadStaffWrite = role_permission(EVERYONE, STAFF, "EveryoneReadStaffWrite")
EveryoneReadAdminWrite = role_permission(EVERYONE, ADMIN, "EveryoneReadAdminWrite")


class HideFromLearnersMixin:
    """Serializer mixin: drop `learner_hidden_fields` from output for students and parents."""

    learner_hidden_fields = ()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request is not None and is_learner(request.user):
            for field in self.learner_hidden_fields:
                data.pop(field, None)
        return data
