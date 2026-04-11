"""Class, Subject, and SubjectTeacher serializers."""

from rest_framework import serializers
from ..models import Class, Subject, SubjectTeacher, Teacher
from .base import _school_from_request


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ("school",)


class ClassSerializer(serializers.ModelSerializer):
    class_teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), source="class_teacher", required=False, allow_null=True
    )
    # Use a separate field for input to avoid iteration conflicts during super().to_representation
    subjects_input = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Class
        fields = [
            "id",
            "name",
            "category",
            "report_mode",
            "class_teacher",
            "class_teacher_id",
            "subjects_input",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "school", "class_teacher")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["class_teacher_id"].queryset = Teacher.objects.filter(school=school)

    def to_internal_value(self, data):
        # Map frontend 'subjects' to 'subjects_input'
        if "subjects" in data and data["subjects"] is not None:
            data = data.copy()
            data["subjects_input"] = data.pop("subjects")
        return super().to_internal_value(data)

    def validate(self, attrs):
        category = attrs.get("category")
        report_mode = attrs.get("report_mode")
        if category == "Nursery" and not report_mode:
            attrs["report_mode"] = "early_years"
        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Explicitly add subjects as list of names for the frontend
        ret["subjects"] = [s.name for s in instance.subjects.all()]
        return ret

    def create(self, validated_data):
        subjects_names = validated_data.pop("subjects_input", [])
        school = validated_data.get("school")

        instance = super().create(validated_data)

        if subjects_names:
            subject_objs = []
            for name in subjects_names:
                sub, _ = Subject.objects.get_or_create(name=name, school=school)
                subject_objs.append(sub)
            instance.subjects.set(subject_objs)

        return instance

    def update(self, instance, validated_data):
        subjects_names = validated_data.pop("subjects_input", None)
        school = instance.school

        instance = super().update(instance, validated_data)

        if subjects_names is not None:
            subject_objs = []
            for name in subjects_names:
                sub, _ = Subject.objects.get_or_create(name=name, school=school)
                subject_objs.append(sub)
            instance.subjects.set(subject_objs)

        return instance


class SubjectTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectTeacher
        fields = "__all__"
        read_only_fields = ("school",)
