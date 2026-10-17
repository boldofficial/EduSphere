import logging

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed


from .models import User

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    subscription = serializers.SerializerMethodField()
    school_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "school", "subscription", "school_details"]

    def get_subscription(self, obj):
        if obj.school:
            from schools.models import PlatformModule, Subscription

            sub = Subscription.objects.filter(school=obj.school).first()
            if sub:
                # Filter allowed_modules by what is GLOBALLY active
                global_active_ids = set(
                    PlatformModule.objects.filter(is_active=True).values_list("module_id", flat=True)
                )
                plan_modules = sub.plan.allowed_modules or []
                effective_modules = [m_id for m_id in plan_modules if m_id in global_active_ids]

                return {
                    "plan_name": sub.plan.name,
                    "status": sub.status,
                    "allowed_modules": effective_modules,
                    "end_date": sub.end_date,
                }
        return None

    def get_school_details(self, obj):
        if obj.school:
            return {"name": obj.school.name, "domain": obj.school.domain, "logo": obj.school.logo}
        return None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed as e:
            logger.error(f"[AUTH_BLOCK] Credential Failure for {attrs.get('username')}: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"[AUTH_BLOCK] Unexpected Auth Error: {str(type(e))} {str(e)}")
            raise e

        # Debugging Login Flow (Safe now)
        logger.info(f"[AUTH_DEBUG] Login success for user: {self.user.username} (Role: {self.user.role})")

        # SUPER ADMIN BYPASS: Always allow super admins to login regardless of tenant context
        if self.user.is_superuser or self.user.role.upper() == "SUPER_ADMIN":
            logger.info(f"[AUTH_DEBUG] SUPER_ADMIN bypass active for {self.user.username}")

            data["role"] = self.user.role
            data["school_id"] = self.user.school.id if self.user.school else None
            data["user"] = {"id": self.user.id, "username": self.user.username, "role": self.user.role}
            return data  # Return immediately for super admins

        # 1. Tenant Locking Security
        # Ensure user belongs to the school matching the current tenant
        request = self.context["request"]
        tenant_id = request.headers.get("X-Tenant-ID")

        # Fallback to middleware-detected tenant if header is missing
        if not tenant_id and hasattr(request, "tenant") and request.tenant:
            tenant_id = request.tenant.domain

        user_school = self.user.school
        logger.info(f"[AUTH_DEBUG] Tenant ID: {tenant_id}, User School: {user_school}")

        if not tenant_id:
            # If no tenant context is provided, users MUST have a school (unless super admin, handled above)
            pass

        if not user_school:
            # User has no school assigned - might be a system user or error
            raise AuthenticationFailed("User is not assigned to any school.")

        if tenant_id and user_school.domain != tenant_id and user_school.custom_domain != tenant_id:
            logger.warning(
                f"[AUTH_BLOCK] User {self.user.email} (School: {user_school.domain}) tried accessing {tenant_id}"
            )
            raise AuthenticationFailed("You do not have permission to login to this school portal.")

        # 2. Check school subscription status
        error = school_access_error(self.user)
        if error:
            raise AuthenticationFailed(error)

        # Add custom claims or user data
        data["role"] = self.user.role
        data["school_id"] = self.user.school.id if self.user.school else None
        data["user"] = {"id": self.user.id, "username": self.user.username, "role": self.user.role}

        # 3. 2FA Enforcement Gate
        if getattr(self.user, "two_factor_enabled", False):
            from rest_framework_simplejwt.tokens import RefreshToken
            from datetime import timedelta

            token = RefreshToken()
            token["user_id"] = self.user.id
            token["token_type"] = "two_factor_pending"
            token.set_exp(lifetime=timedelta(minutes=5))

            logger.info(f"[AUTH_DEBUG] 2FA required for user: {self.user.username}")
            return {
                "requires_2fa": True,
                "two_factor_token": str(token),
                "user_id": self.user.id,
                "message": "2FA required",
            }

        logger.info("[AUTH_DEBUG] Login Successful")
        return data


SUBSCRIPTION_BLOCKS = {
    "pending": "School account is pending approval.",
    "cancelled": "School account is suspended.",
    "expired": "School subscription has expired.",
}


def school_access_error(user):
    """Why this user's school may not sign in right now, or None. Checked at login and on every token refresh."""
    if not getattr(user, "school_id", None):
        return None
    from schools.models import Subscription

    sub = Subscription.objects.filter(school_id=user.school_id).only("status").first()
    if not sub:
        logger.warning(f"[AUTH_DEBUG] School {user.school_id} has NO subscription record.")
        return None
    return SUBSCRIPTION_BLOCKS.get(sub.status)


class SchoolAwareTokenRefreshSerializer(TokenRefreshSerializer):
    """Refreshing a session re-checks the account and the school, so suspended or expired schools are signed out."""

    def validate(self, attrs):
        from django.contrib.auth import get_user_model
        from rest_framework_simplejwt.settings import api_settings
        from rest_framework_simplejwt.tokens import RefreshToken

        token = RefreshToken(attrs["refresh"])
        user = (
            get_user_model().objects.filter(**{api_settings.USER_ID_FIELD: token[api_settings.USER_ID_CLAIM]}).first()
        )
        if not user or not user.is_active:
            raise AuthenticationFailed("This account is no longer active.")
        error = school_access_error(user)
        if error:
            raise AuthenticationFailed(error)
        return super().validate(attrs)
