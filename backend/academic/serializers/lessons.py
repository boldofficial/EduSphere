"""Lesson serializer."""

from rest_framework import serializers
from core.media_utils import get_media_url
from ..models import Lesson


class LessonSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="student_class.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.name", read_only=True)

    class Meta:
        model = Lesson
        fields = "__all__"
        read_only_fields = ("school",)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.file_url:
            ret["file_url"] = get_media_url(instance.file_url)
        return ret
