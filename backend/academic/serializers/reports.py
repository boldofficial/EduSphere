"""ReportCard and SubjectScore serializers."""

import logging
from rest_framework import serializers
from django.db import transaction
from ..models import Class, ReportCard, Student, Subject, SubjectScore
from .base import _school_from_request
from .grading import GradingSchemeSerializer

logger = logging.getLogger(__name__)


class SubjectScoreSerializer(serializers.ModelSerializer):
    subject = serializers.CharField(source="subject.name", required=False)

    class Meta:
        model = SubjectScore
        fields = ["id", "subject", "ca1", "ca2", "exam", "total", "grade", "comment"]
        read_only_fields = ("school",)


class ReportCardSerializer(serializers.ModelSerializer):
    rows = SubjectScoreSerializer(many=True, source="scores", required=False)
    student_name = serializers.CharField(source="student.names", read_only=True)
    class_name = serializers.CharField(source="student_class.name", read_only=True)

    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source="student")
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), source="student_class")
    grading_scheme_details = GradingSchemeSerializer(source="grading_scheme", read_only=True)

    class Meta:
        model = ReportCard
        fields = [
            "id",
            "student_id",
            "student_name",
            "class_id",
            "class_name",
            "session",
            "term",
            "average",
            "total_score",
            "position",
            "attendance_present",
            "attendance_total",
            "affective",
            "psychomotor",
            "early_years_observations",
            "teacher_remark",
            "head_teacher_remark",
            "next_term_begins",
            "promoted_to",
            "is_passed",
            "passed_at",
            "passed_by",
            "performance_trend",
            "ai_performance_remark",
            "rows",
            "grading_scheme",
            "grading_scheme_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["student_id"].queryset = Student.objects.filter(school=school)
            self.fields["class_id"].queryset = Class.objects.filter(school=school)

    def get_validators(self):
        # Suppress automatic unique validation so we can handle it in create() via update_or_create
        return []

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        instance = getattr(self, "instance", None)
        if not school and instance is not None:
            school = instance.school

        student = attrs.get("student")
        if student and school and student.school != school:
            raise serializers.ValidationError({"student_id": "Student must belong to your school."})

        student_class = attrs.get("student_class")
        if student_class and school and student_class.school != school:
            raise serializers.ValidationError({"class_id": "Class must belong to your school."})

        observations = attrs.get("early_years_observations")
        if isinstance(observations, dict):
            attrs["early_years_observations"] = list(observations.values())
        elif observations is not None and not isinstance(observations, list):
            raise serializers.ValidationError({"early_years_observations": "Must be a list of observation objects."})

        return attrs

    def create(self, validated_data):
        scores_data = validated_data.pop("rows", None) or validated_data.pop("scores", [])

        school = validated_data.get("school")
        if not school and "request" in self.context:
            school = getattr(self.context["request"].user, "school", None)

        student = validated_data.pop("student")
        session = validated_data.pop("session")
        term = validated_data.pop("term")

        # Ensure school is explicitly set for creation if not in defaults
        if school:
            validated_data["school"] = school

        # Manual Upsert to handle unique constraints gracefully
        report_card = ReportCard.objects.filter(student=student, session=session, term=term, school=school).first()

        if report_card:
            for attr, value in validated_data.items():
                setattr(report_card, attr, value)
            report_card.save()
        else:
            report_card = ReportCard.objects.create(student=student, session=session, term=term, **validated_data)

        # Update scores efficiently
        self._update_scores(report_card, scores_data, school)

        # Recalculate positions for the class
        if report_card.student_class:
            ReportCard.calculate_positions(school, report_card.student_class, session, term)
            # Reload to get the new position
            report_card.refresh_from_db()

        return report_card

    def update(self, instance, validated_data):
        scores_data = validated_data.pop("rows", None) or validated_data.pop("scores", None)
        school = instance.school

        with transaction.atomic():
            instance = super().update(instance, validated_data)

            if scores_data is not None:
                self._update_scores(instance, scores_data, school)

            # Recalculate positions for the class
            if instance.student_class:
                ReportCard.calculate_positions(school, instance.student_class, instance.session, instance.term)
                instance.refresh_from_db()

        return instance

    def _update_scores(self, report_card, scores_data, school):
        """Helper to sync scores without deleting everything if possible"""
        existing_scores = {s.subject.name: s for s in report_card.scores.all()}

        for score_item in scores_data:
            subject_val = score_item.pop("subject", None)

            # Handle source='subject.name' which can return a dict for input in some DRF versions/configs
            if isinstance(subject_val, dict):
                subject_name = subject_val.get("name")
            else:
                subject_name = subject_val

            if not subject_name:
                continue

            if subject_name in existing_scores:
                score_obj = existing_scores.pop(subject_name)
                for attr, value in score_item.items():
                    setattr(score_obj, attr, value)
                score_obj.save(skip_report_update=True)
            else:
                subject, _ = Subject.objects.get_or_create(name=subject_name, school=school)
                new_score = SubjectScore(report_card=report_card, school=school, subject=subject, **score_item)
                new_score.save(skip_report_update=True)

        # Delete scores for subjects no longer in the report card
        for remaining_score in existing_scores.values():
            remaining_score.delete()

        report_card.update_totals()
