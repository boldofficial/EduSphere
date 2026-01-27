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
        
        # Check school subscription status
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
        
        return data
