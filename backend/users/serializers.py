from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'school']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # 1. Tenant Locking Security
        # Ensure user belongs to the school matching the current tenant
        request = self.context['request']
        tenant_id = request.headers.get('X-Tenant-ID')
        
        # Fallback to middleware-detected tenant if header is missing
        if not tenant_id and hasattr(request, 'tenant') and request.tenant:
            tenant_id = request.tenant.domain

        # Super Admins can login anywhere (though usually on the root domain)
        if self.user.role != 'SUPER_ADMIN':
            if not tenant_id:
                raise AuthenticationFailed('Tenant context is required for login. Please access via your school subdomain.')
            
            # Check if user matches the tenant
            # tenant_id could be a slug or a full domain
            user_school = self.user.school
            if not user_school:
                raise AuthenticationFailed('User is not assigned to any school.')
            
            if user_school.domain != tenant_id:
                # If it's a custom domain, we might need a more complex check, 
                # but for now we assume 'domain' field holds whatever the tenant_id is.
                # In a real system, we'd check school.domain == tenant_id OR school.custom_domain == tenant_id
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
        
        return data
