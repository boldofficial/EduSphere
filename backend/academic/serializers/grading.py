"""Grading scheme and grade range serializers."""

from rest_framework import serializers
from ..models import GradeRange, GradingScheme


class GradeRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeRange
        fields = ["grade", "min_score", "max_score", "remark", "gpa_point"]
        read_only_fields = ("school",)


class GradingSchemeSerializer(serializers.ModelSerializer):
    ranges = GradeRangeSerializer(many=True, read_only=True)

    class Meta:
        model = GradingScheme
        fields = ["id", "name", "is_default", "description", "ranges"]
        read_only_fields = ("school",)
