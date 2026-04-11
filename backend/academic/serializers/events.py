"""School event serializer."""

from rest_framework import serializers
from ..models import SchoolEvent


class SchoolEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

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
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("school", "created_by")
