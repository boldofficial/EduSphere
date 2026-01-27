from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
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
