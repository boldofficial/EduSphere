from rest_framework import serializers
from .models import School, SubscriptionPlan, Subscription, PlatformSettings

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'slug', 'price', 'description', 'features', 'allowed_modules', 'duration_days', 'is_active']

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url
        if instance.payment_proof:
            ret['payment_proof'] = get_media_url(instance.payment_proof)
        return ret

    class Meta:
        model = Subscription
        fields = ['status', 'payment_method', 'payment_proof', 'plan_name', 'plan_id', 'start_date', 'end_date']

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'

class SchoolSerializer(serializers.ModelSerializer):
    subscription_status = serializers.SerializerMethodField()
    admin_id = serializers.SerializerMethodField()
    subscription = SubscriptionSerializer(read_only=True)

    class Meta:
        model = School
        fields = ['id', 'name', 'domain', 'address', 'phone', 'email', 'contact_person', 'logo', 'subscription_status', 'admin_id', 'subscription', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url
        if instance.logo:
            ret['logo'] = get_media_url(instance.logo)
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
    admin_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    
    # New Fields
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    school_email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    contact_person = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    # Payment Fields
    payment_method = serializers.CharField(max_length=20, default='paystack')
    payment_proof = serializers.CharField(required=False, allow_blank=True)

