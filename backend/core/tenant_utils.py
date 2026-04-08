from rest_framework.exceptions import PermissionDenied


def get_request_school(request, allow_super_admin_tenant=True):
    """
    Resolve the effective school for a request.

    Rules:
    - Authenticated non-superadmin users are always bound to request.user.school.
    - If a tenant header/domain is present and does not match request.user.school, reject.
    - Super admins can operate without a school; if allow_super_admin_tenant is True,
      request.tenant can be used to scope actions intentionally.
    """
    user = getattr(request, "user", None)
    tenant_school = getattr(request, "tenant", None)

    if not user or not user.is_authenticated:
        return tenant_school

    if user.is_superuser or getattr(user, "role", "").upper() == "SUPER_ADMIN":
        if allow_super_admin_tenant and tenant_school:
            return tenant_school
        return getattr(user, "school", None)

    user_school = getattr(user, "school", None)
    
    # If the user has a school assigned, it MUST match the tenant context
    if user_school:
        if tenant_school and tenant_school != user_school:
            raise PermissionDenied("Tenant context mismatch for authenticated user.")
        return user_school

    # If the user has no school assigned but we are on a valid tenant domain, use it
    if tenant_school:
        return tenant_school

    raise PermissionDenied("Authenticated user is not assigned to a school.")


def ensure_object_school(obj, school, label="resource"):
    """
    Ensure a related object belongs to the current school.
    """
    if not obj or not school:
        return

    obj_school = getattr(obj, "school", None)
    if obj_school and obj_school != school:
        raise PermissionDenied(f"Cross-tenant reference denied for {label}.")
