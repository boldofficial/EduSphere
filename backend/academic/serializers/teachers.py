"""Teacher serializer."""

from rest_framework import serializers
from users.models import User
from core.media_utils import get_media_url
from ..models import Teacher
from .base import Base64ImageField, _school_from_request


class TeacherSerializer(serializers.ModelSerializer):
    passport_url = Base64ImageField(required=False, allow_null=True)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "user",
            "school",
            "name",
            "address",
            "phone",
            "email",
            "passport_url",
            "staff_type",
            "employment_type",
            "role",
            "tasks",
            "assigned_modules",
            "basic_salary",
            "bank_name",
            "account_number",
            "account_name",
            "pfa_name",
            "pfa_number",
            "tax_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["user"].queryset = User.objects.filter(school=school)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.passport_url:
            ret["passport_url"] = get_media_url(instance.passport_url)
        return ret
