from rest_framework import serializers
from .models import School, SubscriptionPlan, Subscription

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'slug', 'price', 'description', 'features', 'allowed_modules', 'duration_days', 'is_active']

class SchoolSerializer(serializers.ModelSerializer):
    subscription_status = serializers.SerializerMethodField()
    admin_id = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ['id', 'name', 'domain', 'address', 'logo', 'subscription_status', 'admin_id']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.logo:
            from django.core.files.storage import default_storage
            if not instance.logo.startswith('http'):
                try:
                    ret['logo'] = default_storage.url(instance.logo)
                except Exception:
                    pass
        return ret

    def get_subscription_status(self, obj):
        if hasattr(obj, 'subscription'):
            return obj.subscription.status
        return 'none'

    def get_admin_id(self, obj):
        # Return ID of the first SCHOOL_ADMIN found for this school
        admin = obj.users.filter(role='SCHOOL_ADMIN').first()
        return admin.id if admin else None

class RegisterSchoolSerializer(serializers.Serializer):
    school_name = serializers.CharField(max_length=255)
    domain = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    plan_slug = serializers.CharField(max_length=50)
    admin_name = serializers.CharField(max_length=255, required=False)
    
    # New Fields
    phone = serializers.CharField(max_length=20, required=False)
    school_email = serializers.EmailField(required=False)
    address = serializers.CharField(required=False)
    contact_person = serializers.CharField(max_length=255, required=False)

