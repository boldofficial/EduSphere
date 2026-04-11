"""Timetable and Period serializers."""

from rest_framework import serializers
from ..models import Period, Timetable, TimetableEntry


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = "__all__"
        read_only_fields = ("school",)


class TimetableEntrySerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.name", read_only=True)
    period_start = serializers.TimeField(source="period.start_time", read_only=True)

    class Meta:
        model = TimetableEntry
        fields = "__all__"
        read_only_fields = ("school",)


class TimetableSerializer(serializers.ModelSerializer):
    entries = TimetableEntrySerializer(many=True, read_only=True)
    class_name = serializers.CharField(source="student_class.name", read_only=True)

    class Meta:
        model = Timetable
        fields = ["id", "title", "student_class", "class_name", "is_active", "entries", "created_at", "updated_at"]
        read_only_fields = ("school",)
