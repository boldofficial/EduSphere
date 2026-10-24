import logging
import os

from rest_framework_simplejwt.tokens import RefreshToken

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from academic.models import Teacher

logger = logging.getLogger(__name__)
from rest_framework_simplejwt.views import TokenObtainPairView

from emails.tasks import send_email_task
from core.throttles import AuthRateThrottle

from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]


def get_user_me_data(user):
    """Helper to structure user data with school and subscription context."""
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "school": user.school.name if user.school else None,
        "subscription": None,
        "profile_id": None,
        "student_id": None,  # Kept for potential frontend compatibility
        # True after a temporary password: the app asks the user to choose their own before continuing.
        "must_change_password": getattr(user, "must_change_password", False),
    }

    # Fetch profile ID based on role (guard against missing reverse relations)
    try:
        if user.role == "STUDENT":
            student_profile = getattr(user, "student_profile", None)
            if student_profile:
                data["profile_id"] = student_profile.id
                data["student_id"] = student_profile.id
        elif user.role in ["TEACHER", "STAFF"]:
            teacher_profile = getattr(user, "teacher_profile", None)
            if teacher_profile:
                data["profile_id"] = teacher_profile.id
    except Exception as e:
        logger.warning(f"[ME_VIEW] Profile relation lookup failed for user {user.id}: {e}")

    if user.school:
        from schools.models import PlatformModule
        from schools.models import Subscription

        # Use query instead of reverse relation to avoid RelatedObjectDoesNotExist crashes
        sub = Subscription.objects.filter(school=user.school).first()
        if not sub:
            return data

        # Filter allowed_modules by what is GLOBALLY active
        global_active_ids = set(PlatformModule.objects.filter(is_active=True).values_list("module_id", flat=True))
        plan_modules = sub.plan.allowed_modules or []
        effective_modules = [m_id for m_id in plan_modules if m_id in global_active_ids]

        data["subscription"] = {"plan_name": sub.plan.name, "status": sub.status, "allowed_modules": effective_modules}
    return data


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_user_me_data(request.user))


class ImpersonateUserView(APIView):
    """
    Generate JWT tokens for a target user.
    Strictly Super Admin only.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "SUPER_ADMIN":
            logger.warning(f"Unauthorized impersonation attempt by {request.user.email}")
            raise PermissionDenied("Only Super Admins can impersonate users.")

        user_id = request.data.get("user_id")
        if not user_id:
            raise ValidationError({"detail": "user_id is required"})

        User = get_user_model()
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise NotFound("Target user not found")

        refresh = RefreshToken.for_user(target_user)

        logger.info(f"SUPER ADMIN {request.user.email} is impersonating {target_user.email}")

        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh), "user": get_user_me_data(target_user)}
        )


class CreateAccountView(APIView):
    """
    Manually create or update a user account for a Teacher or Staff profile.
    This links a User record to an existing Teacher profile.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ["SUPER_ADMIN", "SCHOOL_ADMIN"]:
            logger.warning(f"Unauthorized account setup attempt by {request.user.email} (Role: {request.user.role})")
            raise PermissionDenied("Only admins can setup accounts.")

        profile_id = request.data.get("profileId")
        profile_type = request.data.get("profileType")  # 'teacher' or 'staff'
        email = request.data.get("email")
        password = request.data.get("password")
        name = request.data.get("name")

        logger.info(f"[AUTH_DEBUG] CreateAccountView - profileId: {profile_id}, type: {profile_type}, email: {email}")

        if not all([profile_id, profile_type, email, password]):
            logger.error(f"[AUTH_DEBUG] Missing fields in account setup: {request.data}")
            raise ValidationError({"detail": "Missing required fields: profileId, profileType, email, password"})

        User = get_user_model()

        # Determine the user role based on profile type
        role = "TEACHER" if profile_type == "teacher" else "STAFF"

        # Find the profile record
        try:
            # Note: The 'Teacher' model in this codebase handles both academic and non-academic staff
            profile = Teacher.objects.get(pk=profile_id)
            logger.info(f"[AUTH_DEBUG] Found profile: {profile.name} (ID: {profile_id}) in school: {profile.school}")

            # SCHOOL ISOLATION CHECK
            # If not superadmin, ensure the admin belongs to the same school as the profile
            if request.user.role == "SCHOOL_ADMIN" and profile.school != request.user.school:
                logger.warning(
                    f"Admin {request.user.email} attempted to setup account for profile in different school: {profile.school}"
                )
                raise PermissionDenied("You can only setup accounts for staff in your own school.")

        except Teacher.DoesNotExist:
            logger.error(f"[AUTH_DEBUG] Teacher profile NOT FOUND for ID: {profile_id}")
            raise NotFound({"detail": f"{profile_type.capitalize()} profile not found with ID {profile_id}"})

        # Create or update the User record (strict school isolation)
        existing_user = User.objects.filter(username=email).first()
        created = existing_user is None

        if existing_user and existing_user.school and existing_user.school != profile.school:
            logger.warning(f"Cross-tenant account setup blocked: {email} already belongs to {existing_user.school}")
            raise ValidationError({"detail": "This account email already belongs to another school."})

        try:
            validate_password(password, user=None if created else existing_user)
        except DjangoValidationError as e:
            raise ValidationError({"password": list(e.messages)})

        if created:
            user = User.objects.create(username=email, email=email, role=role, school=profile.school, is_active=True)
        else:
            user = existing_user
            # Never reassign users across schools; this is guarded above.
            if not user.school:
                user.school = profile.school
            user.email = email
            user.role = role

        user.set_password(password)
        user.save()

        # Link the user to the profile if not already linked
        profile.user = user
        profile.save()

        logger.info(
            f"Account setup complete for {email} (Role: {role}, Type: {profile.staff_type}, Created: {created}) by {request.user.email}"
        )

        if created:
            try:
                send_email_task.delay(
                    "welcome_email",
                    email,
                    {
                        "school_name": user.school.name if user.school else "Registra",
                        "domain": user.school.domain if user.school else "app",
                    },
                )
            except Exception as e:
                logger.error(f"Failed to queue welcome email for staff {email}: {e}")

        return Response(
            {
                "message": "Account created successfully",
                "user_id": user.id,
                "username": user.username,
                "created": created,
            }
        )


# Role -> (User.role value, profile relation the portal needs to show anything)
_DEMO_ROLES = {
    "admin": ("SCHOOL_ADMIN", None),
    "teacher": ("TEACHER", "teacher_profile"),
    "student": ("STUDENT", "student_profile"),
    "staff": ("STAFF", None),
}


def _demo_user(User, role_type, preferred_username):
    """
    The demo school's account for a role. Prefer the configured username, but only if it has the
    profile that role needs (a student login with no student record shows an empty portal);
    otherwise fall back to any demo-school user of that role that has one.
    """
    role, profile = _DEMO_ROLES.get(role_type, ("SCHOOL_ADMIN", None))
    demo_users = User.objects.filter(school__domain="demo")
    with_profile = demo_users.filter(role=role)
    if profile:
        with_profile = with_profile.filter(**{f"{profile}__isnull": False})
    return (
        with_profile.filter(username=preferred_username).first()
        or with_profile.order_by("id").first()
        or demo_users.filter(username=preferred_username).first()
    )


class DemoLoginView(APIView):
    """Magic login for the demo school."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        demo_login_enabled = os.environ.get("ENABLE_DEMO_LOGIN", "False").lower() in ("true", "1", "yes")
        if not demo_login_enabled:
            return Response({"detail": "Demo login is disabled."}, status=403)

        role_type = request.data.get("role", "admin")  # admin, teacher, bursar

        username_map = {
            "admin": "demo@myregistra.net",
            "teacher": "teacher@myregistra.net",
            "student": "ST001@demo",
            "staff": "staff@myregistra.net",
        }

        User = get_user_model()
        user = _demo_user(User, role_type, username_map.get(role_type, "demo_admin"))
        if user is None:
            raise NotFound({"detail": f"Demo user for {role_type} not found. Please run the seeder."})

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({"access": str(refresh.access_token), "refresh": str(refresh), "user": get_user_me_data(user)})


class PasswordResetRequestView(APIView):
    """
    Request a password reset link.

    Staff and parents: {"email"}. Students: {"student_no", "email"} where email is the parent email the
    school has on record; the link goes to that address. The response is the same whether or not an
    account matched, so this can't be used to discover accounts.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        from django.db.models import Q

        from academic.models import Student
        from core.tenant_utils import get_request_school
        from emails.notify import queue_template_email, school_portal_url

        email = (request.data.get("email") or "").strip()
        student_no = (request.data.get("student_no") or "").strip()
        if not email:
            raise ValidationError({"detail": "email is required"})

        User = get_user_model()
        user = None
        school = None
        if student_no:
            school = get_request_school(request) if getattr(request, "tenant", None) else None
            student = (
                Student.objects.filter(school=school, student_no__iexact=student_no, parent_email__iexact=email)
                .select_related("user", "school")
                .first()
                if school
                else None
            )
            user = student.user if student and student.user and student.user.is_active else None
        else:
            # Never guess between accounts that share an address; students reset with their admission number.
            matches = list(User.objects.filter(Q(email__iexact=email), is_active=True).exclude(role="STUDENT")[:2])
            user = matches[0] if len(matches) == 1 else None
            school = user.school if user else None

        if user:
            from django.contrib.auth.tokens import PasswordResetTokenGenerator
            from django.utils.encoding import force_bytes
            from django.utils.http import urlsafe_base64_encode

            token = PasswordResetTokenGenerator().make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            base = (
                school_portal_url(school) if school else f"https://{getattr(settings, 'ROOT_DOMAIN', 'myregistra.net')}"
            )
            queue_template_email(
                "password_reset",
                [email],
                {
                    "reset_url": f"{base}/reset-password?uid={uid}&token={token}",
                    "name": user.get_full_name() or user.username,
                    "is_student": user.role == "STUDENT",
                },
            )
            logger.info("Password reset link sent for user %s", user.pk)
        else:
            logger.info("Password reset requested with no unique matching account.")
        return Response({"message": "If the details match an account, a reset link has been sent."})


class ChangePasswordView(APIView):
    """Signed-in users change their own password (required after a temporary one)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        user = request.user
        current = request.data.get("current_password") or ""
        new = request.data.get("new_password") or ""
        if not user.check_password(current):
            return Response({"detail": "Your current password is not correct."}, status=400)
        if new == current:
            return Response({"detail": "Choose a password different from the current one."}, status=400)
        try:
            validate_password(new, user)
        except DjangoValidationError as error:
            return Response({"detail": " ".join(error.messages)}, status=400)
        user.set_password(new)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        return Response({"detail": "Password changed."})


class PasswordResetConfirmView(APIView):
    """
    Endpoint to confirm a password reset using the token from the email link.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uid or not token or not new_password:
            raise ValidationError({"detail": "uid, token, and new_password are required"})

        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        User = get_user_model()
        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid reset link."}, status=400)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({"detail": "Reset link has expired or is invalid."}, status=400)

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response({"detail": " ".join(e.messages), "errors": list(e.messages)}, status=400)

        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        logger.info(f"Password reset completed for {user.email}")

        return Response({"message": "Password has been reset successfully."})
