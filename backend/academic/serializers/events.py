"""School event serializer."""

from rest_framework import serializers
from ..models import Class, SchoolEvent
from .base import _school_from_request


class SchoolEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(
        source="student_class", queryset=Class.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = SchoolEvent
        fields = [
            "id",
            "title",
            "description",
            "start_date",
            "end_date",
            "event_type",
            "target_audience",
            "class_id",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("school", "created_by")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["class_id"].queryset = Class.objects.filter(school=school)
