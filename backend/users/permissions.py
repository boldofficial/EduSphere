from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """Allows access only to Super Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, "role", None) == "SUPER_ADMIN"
        )

class IsSchoolAdmin(permissions.BasePermission):
    """Allows access only to School Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, "role", None) == "SCHOOL_ADMIN"
        )

class IsTeacher(permissions.BasePermission):
    """Allows access only to Teachers."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, "role", None) == "TEACHER"
        )
