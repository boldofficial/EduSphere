from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .models import User

import logging
logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    subscription = serializers.SerializerMethodField()
    school_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'school', 'subscription', 'school_details']

    def get_subscription(self, obj):
        if obj.school and hasattr(obj.school, 'subscription'):
            sub = obj.school.subscription
            return {
                'status': sub.status,
                'plan': sub.plan.name,
                'allowed_modules': sub.plan.allowed_modules,
                'end_date': sub.end_date
            }
        return None

    def get_school_details(self, obj):
        if obj.school:
           return {
               'name': obj.school.name,
               'domain': obj.school.domain,
               'logo': obj.school.logo
           }
        return None

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Debugging Login Flow (Safe now)
        print(f"[AUTH_DEBUG] Login success for user: {self.user.username} (Role: {self.user.role})")
        
        # 1. Tenant Locking Security
        # Ensure user belongs to the school matching the current tenant
        request = self.context['request']
        tenant_id = request.headers.get('X-Tenant-ID')
        
        # Fallback to middleware-detected tenant if header is missing
        if not tenant_id and hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.domain

        user_school = self.user.school
        print(f"[AUTH_DEBUG] Tenant ID: {tenant_id}, User School: {user_school}")
        
        if self.user.role != 'SUPER_ADMIN':
            if not tenant_id:
                # If no tenant context, we can't validate (unless it's a super admin, handled above)
                pass 
            
            if not user_school:
                # User has no school assigned - might be a system user or error
                # For now, if they are not super admin, they should have a school
                raise AuthenticationFailed('User is not assigned to any school.')
            
            if tenant_id and user_school.domain != tenant_id and user_school.custom_domain != tenant_id:
                logger.warning(f"[AUTH_BLOCK] User {self.user.email} (School: {user_school.domain}) tried accessing {tenant_id}")
                raise AuthenticationFailed('You do not have permission to login to this school portal.')

        # 2. Check school subscription status
        if self.user.school:
            # We need to access the related subscription safely
            if hasattr(self.user.school, 'subscription'):
                status = self.user.school.subscription.status
                if status == 'pending':
                    raise AuthenticationFailed('School account is pending approval.')
                elif status == 'cancelled':
                    raise AuthenticationFailed('School account is suspended.')
                elif status == 'expired':
                    raise AuthenticationFailed('School subscription has expired.')
        
        # Add custom claims or user data
        data['role'] = self.user.role
        data['school_id'] = self.user.school.id if self.user.school else None
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'role': self.user.role
        }
        
        print("[AUTH_DEBUG] Login Successful")
        return data
