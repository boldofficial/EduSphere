"""Attendance serializers."""

from rest_framework import serializers
from ..models import AttendanceRecord, AttendanceSession


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = "__all__"
        read_only_fields = ("school",)


class AttendanceSessionSerializer(serializers.ModelSerializer):
    records = AttendanceRecordSerializer(many=True, read_only=True)
    class_name = serializers.CharField(source="student_class.name", read_only=True)

    class Meta:
        model = AttendanceSession
        fields = "__all__"
        read_only_fields = ("school",)
