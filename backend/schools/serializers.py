from rest_framework import serializers

from .models import PlatformSettings, School, SchoolPaymentConfig, Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "price",
            "description",
            "features",
            "allowed_modules",
            "duration_days",
            "is_active",
            "custom_domain_enabled",
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url

        if instance.payment_proof:
            ret["payment_proof"] = get_media_url(instance.payment_proof)
        return ret

    class Meta:
        model = Subscription
        fields = ["status", "payment_method", "payment_proof", "plan_name", "plan_id", "start_date", "end_date"]


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = "__all__"


class SchoolSerializer(serializers.ModelSerializer):
    subscription_status = serializers.SerializerMethodField()
    admin_id = serializers.SerializerMethodField()
    subscription = SubscriptionSerializer(read_only=True)

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "domain",
            "address",
            "phone",
            "email",
            "contact_person",
            "logo",
            "subscription_status",
            "admin_id",
            "subscription",
            "created_at",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url

        if instance.logo:
            ret["logo"] = get_media_url(instance.logo)
        return ret

    def get_subscription_status(self, obj):
        if hasattr(obj, "subscription"):
            return obj.subscription.status
        return "none"

    def get_admin_id(self, obj):
        # Return ID of the first SCHOOL_ADMIN found for this school
        admin = obj.users.filter(role="SCHOOL_ADMIN").first()
        return admin.id if admin else None


class RegisterSchoolSerializer(serializers.Serializer):
    school_name = serializers.CharField(max_length=255)
    domain = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    plan_slug = serializers.CharField(max_length=50)
    admin_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

    # New Fields
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    school_email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    contact_person = serializers.CharField(max_length=255, required=False, allow_blank=True)

    # Payment Fields
    payment_method = serializers.CharField(max_length=20, default="paystack")
    payment_proof = serializers.CharField(required=False, allow_blank=True)


from .models import DemoRequest


class DemoRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoRequest
        fields = ["id", "name", "email", "phone", "school_name", "role", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]


from .models import SupportTicket, TicketResponse


class TicketResponseSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TicketResponse
        fields = ["id", "username", "message", "is_admin_response", "created_at"]


class SupportTicketSerializer(serializers.ModelSerializer):
    responses = TicketResponseSerializer(many=True, read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True)
    requester_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "school_id",
            "school_name",
            "requester_name",
            "subject",
            "category",
            "priority",
            "status",
            "description",
            "responses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]


class SchoolPaymentConfigAdminSerializer(serializers.ModelSerializer):
    supports_online_payment = serializers.SerializerMethodField()
    has_paystack_secret = serializers.SerializerMethodField()
    has_flutterwave_secret = serializers.SerializerMethodField()

    class Meta:
        model = SchoolPaymentConfig
        fields = [
            "enable_cash",
            "enable_bank_transfer",
            "enable_paystack",
            "enable_flutterwave",
            "default_payment_method",
            "paystack_public_key",
            "paystack_secret_key",
            "paystack_webhook_secret",
            "flutterwave_public_key",
            "flutterwave_secret_key",
            "flutterwave_webhook_secret",
            "bank_name",
            "bank_account_name",
            "bank_account_number",
            "bank_sort_code",
            "transfer_instructions",
            "require_transfer_proof",
            "pass_processing_fee_to_parents",
            "supports_online_payment",
            "has_paystack_secret",
            "has_flutterwave_secret",
            "updated_at",
        ]
        read_only_fields = ["supports_online_payment", "has_paystack_secret", "has_flutterwave_secret", "updated_at"]
        extra_kwargs = {
            "paystack_secret_key": {"write_only": True, "required": False, "allow_blank": True},
            "paystack_webhook_secret": {"write_only": True, "required": False, "allow_blank": True},
            "flutterwave_secret_key": {"write_only": True, "required": False, "allow_blank": True},
            "flutterwave_webhook_secret": {"write_only": True, "required": False, "allow_blank": True},
        }

    def get_supports_online_payment(self, obj):
        return bool(obj.enable_paystack or obj.enable_flutterwave)

    def get_has_paystack_secret(self, obj):
        return bool(obj.paystack_secret_key)

    def get_has_flutterwave_secret(self, obj):
        return bool(obj.flutterwave_secret_key)

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        enable_cash = attrs.get("enable_cash", instance.enable_cash if instance else True)
        enable_bank_transfer = attrs.get("enable_bank_transfer", instance.enable_bank_transfer if instance else True)
        enable_paystack = attrs.get("enable_paystack", instance.enable_paystack if instance else False)
        enable_flutterwave = attrs.get("enable_flutterwave", instance.enable_flutterwave if instance else False)
        default_payment_method = attrs.get(
            "default_payment_method", instance.default_payment_method if instance else "bank_transfer"
        )

        if not any([enable_cash, enable_bank_transfer, enable_paystack, enable_flutterwave]):
            raise serializers.ValidationError("At least one payment method must be enabled.")

        enabled_map = {
            "cash": enable_cash,
            "bank_transfer": enable_bank_transfer,
            "paystack": enable_paystack,
            "flutterwave": enable_flutterwave,
        }
        if not enabled_map.get(default_payment_method):
            raise serializers.ValidationError(
                {"default_payment_method": "Default payment method must be one of the enabled methods."}
            )

        # When enabling gateways, public keys are required.
        paystack_public_key = attrs.get("paystack_public_key", instance.paystack_public_key if instance else "")
        flutterwave_public_key = attrs.get("flutterwave_public_key", instance.flutterwave_public_key if instance else "")

        if enable_paystack and not paystack_public_key:
            raise serializers.ValidationError({"paystack_public_key": "Paystack public key is required when enabled."})
        if enable_flutterwave and not flutterwave_public_key:
            raise serializers.ValidationError(
                {"flutterwave_public_key": "Flutterwave public key is required when enabled."}
            )

        return attrs


class SchoolPaymentConfigPublicSerializer(serializers.ModelSerializer):
    supports_online_payment = serializers.SerializerMethodField()
    enabled_methods = serializers.SerializerMethodField()

    class Meta:
        model = SchoolPaymentConfig
        fields = [
            "enable_cash",
            "enable_bank_transfer",
            "enable_paystack",
            "enable_flutterwave",
            "default_payment_method",
            "supports_online_payment",
            "enabled_methods",
            "paystack_public_key",
            "flutterwave_public_key",
            "bank_name",
            "bank_account_name",
            "bank_account_number",
            "bank_sort_code",
            "transfer_instructions",
            "require_transfer_proof",
            "pass_processing_fee_to_parents",
            "updated_at",
        ]
        read_only_fields = fields

    def get_supports_online_payment(self, obj):
        return bool(obj.enable_paystack or obj.enable_flutterwave)

    def get_enabled_methods(self, obj):
        methods = []
        if obj.enable_cash:
            methods.append("cash")
        if obj.enable_bank_transfer:
            methods.append("bank_transfer")
        if obj.enable_paystack:
            methods.append("paystack")
        if obj.enable_flutterwave:
            methods.append("flutterwave")
        return methods


from academic.serializers import Base64ImageField
from django.db import transaction
from .models import SchoolSettings


class SchoolSettingsSerializer(serializers.ModelSerializer):
    # School fields (proxied)
    school_name = serializers.CharField(source="school.name", required=False)
    school_address = serializers.CharField(source="school.address", required=False, allow_blank=True)
    school_email = serializers.EmailField(source="school.email", required=False, allow_blank=True)
    school_phone = serializers.CharField(source="school.phone", required=False, allow_blank=True)
    custom_domain = serializers.CharField(source="school.custom_domain", required=False, allow_blank=True, allow_null=True)
    logo_media = Base64ImageField(source="school.logo", required=False, allow_null=True)

    # Media fields
    watermark_media = Base64ImageField(required=False, allow_null=True)
    director_signature = Base64ImageField(required=False, allow_null=True)
    head_of_school_signature = Base64ImageField(required=False, allow_null=True)
    landing_hero_image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = SchoolSettings
        fields = "__all__"
        read_only_fields = ("school",)

    def update(self, instance, validated_data):
        school_data = validated_data.pop("school", {})
        school = instance.school

        with transaction.atomic():
            # Update School model if data is provided
            if school_data:
                custom_domain = school_data.get("custom_domain")
                if isinstance(custom_domain, str):
                    normalized = custom_domain.strip()
                    school_data["custom_domain"] = normalized or None

                for attr, value in school_data.items():
                    setattr(school, attr, value)
                school.save()

            # Handle landing_gallery_images specifically if they are base64
            if "landing_gallery_images" in validated_data:
                images = validated_data["landing_gallery_images"]
                if isinstance(images, list):
                    processed = []
                    field = Base64ImageField()
                    for img in images:
                        processed.append(field.to_internal_value(img))
                    validated_data["landing_gallery_images"] = processed

            # Handle landing_academic_programs images
            if "landing_academic_programs" in validated_data:
                programs = validated_data["landing_academic_programs"]
                if isinstance(programs, list):
                    field = Base64ImageField()
                    for p in programs:
                        if isinstance(p, dict) and p.get("image"):
                            p["image"] = field.to_internal_value(p["image"])

            # Handle landing_testimonials images
            if "landing_testimonials" in validated_data:
                testimonials = validated_data["landing_testimonials"]
                if isinstance(testimonials, list):
                    field = Base64ImageField()
                    for t in testimonials:
                        if isinstance(t, dict) and t.get("image"):
                            t["image"] = field.to_internal_value(t["image"])

            # Update the rest
            return super().update(instance, validated_data)
