"""Admission serializers."""

from rest_framework import serializers
from ..models import Admission, AdmissionIntake


class AdmissionIntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionIntake
        fields = "__all__"
        read_only_fields = ("school",)


class AdmissionSerializer(serializers.ModelSerializer):
    intake_name = serializers.CharField(source="intake.name", read_only=True)

    class Meta:
        model = Admission
        fields = "__all__"
        read_only_fields = ("school", "reviewed_at", "reviewed_by")
