"""Student, StudentHistory, and StudentAchievement serializers."""

import logging
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from core.media_utils import get_media_url
from users.models import User
from ..models import Class, Student, StudentAchievement, StudentHistory, ReportCard
from .base import Base64ImageField

logger = logging.getLogger(__name__)


class StudentSerializer(serializers.ModelSerializer):
    class_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)

    passport_url = Base64ImageField(required=False, allow_null=True)
    performance_trend = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "user",
            "student_no",
            "names",
            "gender",
            "current_class",
            "class_id",
            "dob",
            "parent_name",
            "parent_email",
            "parent_phone",
            "address",
            "passport_url",
            "assigned_fees",
            "discounts",
            "password",
            "status",
            "performance_trend",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("school", "user", "current_class")

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Force class_id to be an integer (native ID type) to match frontend expectation
        ret["class_id"] = instance.current_class.id if instance.current_class else None

        if instance.passport_url:
            ret["passport_url"] = get_media_url(instance.passport_url)
        return ret

    def get_performance_trend(self, obj):
        # Fetch the latest report card for this student to get their most recent trend
        try:
            latest_report = ReportCard.objects.filter(student=obj).order_by("-created_at").first()
            if latest_report and hasattr(latest_report, 'performance_trend'):
                return latest_report.performance_trend
        except Exception as e:
            logger.warning(f"Failed to fetch performance trend for student {obj.id}: {e}")
        return "stable"

    def to_internal_value(self, data):
        data = data.copy()
        # Handle empty strings for optional fields
        if data.get("dob") == "":
            data["dob"] = None

        return super().to_internal_value(data)

    def create(self, validated_data):
        class_id = validated_data.pop("class_id", None)
        password = validated_data.pop("password", None)
        school = validated_data.get("school", None)

        # Resolve class
        if class_id:
            try:
                class_qs = Class.objects.filter(id=class_id)
                if school:
                    class_qs = class_qs.filter(school=school)
                validated_data["current_class"] = class_qs.get()
            except Class.DoesNotExist:
                pass

        instance = super().create(validated_data)

        if password and instance.student_no:
            # Generate scoped username to prevent collisions across tenants
            # Format: ST001@vine-heritage
            school_suffix = instance.school.domain if instance.school and instance.school.domain else "school"
            username = f"{instance.student_no}@{school_suffix}"
            email = instance.parent_email or f"{username}.com"  # distinct from real emails

            # Check if user exists (should not exist with this scoped username)
            if not User.objects.filter(username=username).exists():
                user = User.objects.create(
                    username=username,
                    email=email,
                    password=make_password(password),
                    role="STUDENT",
                    school=instance.school,
                    is_active=True,
                )
                instance.user = user
                instance.save()
            else:
                # If user exists (e.g. re-enrolling), just link it
                user = User.objects.get(username=username)
                user.password = make_password(password)  # Update password
                user.save()
                instance.user = user
                instance.save()

        return instance

    def update(self, instance, validated_data):
        try:
            class_id = validated_data.pop("class_id", None)
            password = validated_data.pop("password", None)

            if class_id:
                try:
                    class_qs = Class.objects.filter(id=class_id, school=instance.school)
                    validated_data["current_class"] = class_qs.get()
                except Class.DoesNotExist:
                    pass

            instance = super().update(instance, validated_data)

            # Update password if provided
            if password and instance.user:
                instance.user.password = make_password(password)
                instance.user.save()
            elif password and not instance.user:
                # Create user if it doesn't exist during update
                school_suffix = instance.school.domain if instance.school and instance.school.domain else "school"
                username = f"{instance.student_no}@{school_suffix}"
                email = instance.parent_email or f"{username}.com"

                if not User.objects.filter(username=username).exists():
                    user = User.objects.create(
                        username=username,
                        email=email,
                        password=make_password(password),
                        role="STUDENT",
                        school=instance.school,
                        is_active=True,
                    )
                    instance.user = user
                    instance.save()
                else:
                    # Link existing
                    user = User.objects.get(username=username)
                    user.password = make_password(password)
                    user.save()
                    instance.user = user
                    instance.save()

            return instance
        except Exception as e:
            logger.exception(f"Student update failed: {str(e)}")
            raise e


class StudentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentHistory
        fields = "__all__"
        read_only_fields = ("school",)


class StudentAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAchievement
        fields = "__all__"
        read_only_fields = ("school",)
