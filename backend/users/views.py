from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from academic.models import Teacher
import logging
from .models import User

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

def get_user_me_data(user):
    """Helper to structure user data with school and subscription context."""
    data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'school': user.school.name if user.school else None,
        'subscription': None
    }

    if user.school and hasattr(user.school, 'subscription'):
        from schools.models import PlatformModule
        sub = user.school.subscription
        
        # Filter allowed_modules by what is GLOBALLY active
        global_active_ids = set(PlatformModule.objects.filter(is_active=True).values_list('module_id', flat=True))
        plan_modules = sub.plan.allowed_modules or []
        effective_modules = [m_id for m_id in plan_modules if m_id in global_active_ids]

        data['subscription'] = {
            'plan_name': sub.plan.name,
            'status': sub.status,
            'allowed_modules': effective_modules
        }
    return data

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_user_me_data(request.user))

logger = logging.getLogger(__name__)

class ImpersonateUserView(APIView):
    """
    Generate JWT tokens for a target user.
    Strictly Super Admin only.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'SUPER_ADMIN':
            logger.warning(f"Unauthorized impersonation attempt by {request.user.email}")
            raise PermissionDenied("Only Super Admins can impersonate users.")

        user_id = request.data.get('user_id')
        if not user_id:
            raise ValidationError({"detail": "user_id is required"})

        User = get_user_model()
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise NotFound("Target user not found")

        refresh = RefreshToken.for_user(target_user)
        
        logger.info(f"SUPER ADMIN {request.user.email} is impersonating {target_user.email}")

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': get_user_me_data(target_user)
        })

class CreateAccountView(APIView):
    """
    Manually create or update a user account for a Teacher or Staff profile.
    This links a User record to an existing Teacher profile.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['SUPER_ADMIN', 'SCHOOL_ADMIN']:
            logger.warning(f"Unauthorized account setup attempt by {request.user.email} (Role: {request.user.role})")
            raise PermissionDenied("Only admins can setup accounts.")

        profile_id = request.data.get('profileId')
        profile_type = request.data.get('profileType') # 'teacher' or 'staff'
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name')

        logger.info(f"[AUTH_DEBUG] CreateAccountView - profileId: {profile_id}, type: {profile_type}, email: {email}")

        if not all([profile_id, profile_type, email, password]):
            logger.error(f"[AUTH_DEBUG] Missing fields in account setup: {request.data}")
            raise ValidationError({"detail": "Missing required fields: profileId, profileType, email, password"})

        User = get_user_model()
        
        # Determine the user role based on profile type
        role = 'TEACHER' if profile_type == 'teacher' else 'STAFF'
        
        # Find the profile record
        try:
            # Note: The 'Teacher' model in this codebase handles both academic and non-academic staff
            profile = Teacher.objects.get(pk=profile_id)
            logger.info(f"[AUTH_DEBUG] Found profile: {profile.name} (ID: {profile_id}) in school: {profile.school}")
            
            # SCHOOL ISOLATION CHECK
            # If not superadmin, ensure the admin belongs to the same school as the profile
            if request.user.role == 'SCHOOL_ADMIN' and profile.school != request.user.school:
                logger.warning(f"Admin {request.user.email} attempted to setup account for profile in different school: {profile.school}")
                raise PermissionDenied("You can only setup accounts for staff in your own school.")
                
        except Teacher.DoesNotExist:
            logger.error(f"[AUTH_DEBUG] Teacher profile NOT FOUND for ID: {profile_id}")
            raise NotFound({"detail": f"{profile_type.capitalize()} profile not found with ID {profile_id}"})

        # Create or update the User record
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'role': role,
                'school': profile.school,
                'is_active': True
            }
        )

        user.set_password(password)
        # Explicitly update role if it changed or user existed
        user.role = role 
        user.save()

        # Link the user to the profile if not already linked
        profile.user = user
        profile.save()

        logger.info(f"Account setup complete for {email} (Role: {role}, Type: {profile.staff_type}, Created: {created}) by {request.user.email}")

        return Response({
            "message": "Account created successfully",
            "user_id": user.id,
            "username": user.username,
            "created": created
        })

class DemoLoginView(APIView):
    """Magic login for the demo school."""
    permission_classes = [AllowAny]
    def post(self, request):
        role_type = request.data.get('role', 'admin') # admin, teacher, bursar
        
        username_map = {
            'admin': 'demo_admin',
            'teacher': 'demo_teacher',
            'student': 'demo_student'
        }
        
        username = username_map.get(role_type, 'demo_admin')
        
        User = get_user_model()
        try:
            # Note: The seeder creates these users with school__domain='demo'
            user = User.objects.get(username=username, school__domain='demo')
        except User.DoesNotExist:
            raise NotFound({"detail": f"Demo user for {role_type} not found. Please run the seeder."})

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': get_user_me_data(user)
        })
