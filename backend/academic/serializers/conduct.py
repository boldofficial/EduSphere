"""Conduct entry serializer."""

from rest_framework import serializers
from ..models import ConductEntry


class ConductEntrySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.username", read_only=True)

    class Meta:
        model = ConductEntry
        fields = "__all__"
        read_only_fields = ("school", "recorded_by")
