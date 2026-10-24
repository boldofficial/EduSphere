"""
JWT authentication bound to the signed-in user's school.

TenantMiddleware resolves `request.tenant` from the host or the X-Tenant-ID header before DRF knows
who the user is, so on its own the tenant is whatever the client claims. Once the token identifies
the user, this class makes the two agree: a token from one school can never act on another, and a
request with no tenant context runs in the user's own school. Views that read `request.tenant`
directly are therefore as safe as those that call get_request_school.
"""

from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

from core.audit import set_actor


class TenantJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        set_actor(user, request._request)  # attributes this request's changes in the audit trail
        # Platform admins work across schools on purpose (tenant header selects the school).
        if user.is_superuser or (getattr(user, "role", "") or "").upper() == "SUPER_ADMIN":
            return result

        school = getattr(user, "school", None)
        raw = request._request
        tenant = getattr(raw, "tenant", None)
        if school is not None:
            if tenant is not None and tenant.pk != school.pk:
                raise PermissionDenied("This account belongs to a different school.")
            if tenant is None:
                raw.tenant = school
        return result


try:
    from drf_spectacular.contrib.rest_framework_simplejwt import SimpleJWTScheme

    class TenantJWTScheme(SimpleJWTScheme):
        """Document it exactly like plain SimpleJWT (bearer token, `jwtAuth`)."""

        target_class = "core.authentication.TenantJWTAuthentication"

except ImportError:  # schema tooling not installed
    pass
