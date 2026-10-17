"""Attendance serializers."""

from django.db import transaction
from rest_framework import serializers

from ..models import AttendanceRecord, AttendanceSession, Class, Student
from .base import _school_from_request

STATUSES = {choice for choice, _ in AttendanceRecord._meta.get_field("status").choices}


class AttendanceRecordSerializer(serializers.ModelSerializer):
    # The frontend identifies students as `student_id`.
    student_id = serializers.ReadOnlyField()

    class Meta:
        model = AttendanceRecord
        fields = "__all__"
        read_only_fields = ("school",)


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """
    A class register for one day. Accepts the frontend's shape:
      {date, class_id, session, term, records: [{student_id, status}]}
    Saving the same class and date twice updates that register instead of creating a duplicate.
    """

    records = AttendanceRecordSerializer(many=True, read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(source="student_class", queryset=Class.objects.all(), required=False)
    class_name = serializers.CharField(source="student_class.name", read_only=True)

    class Meta:
        model = AttendanceSession
        fields = "__all__"
        read_only_fields = ("school",)
        extra_kwargs = {"student_class": {"required": False}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["class_id"].queryset = Class.objects.filter(school=school)
            self.fields["student_class"].queryset = Class.objects.filter(school=school)

    def to_internal_value(self, data):
        records = data.get("records") if hasattr(data, "get") else None
        validated = super().to_internal_value(data)
        if records is not None:
            validated["_records"] = self._validate_records(records)
        return validated

    def validate(self, attrs):
        if not self.instance and not attrs.get("student_class"):
            raise serializers.ValidationError({"class_id": "Choose a class."})
        return attrs

    def _validate_records(self, records):
        if not isinstance(records, list):
            raise serializers.ValidationError({"records": "Expected a list."})
        cleaned = {}
        for item in records:
            student_id = item.get("student_id", item.get("student")) if isinstance(item, dict) else None
            status = (item.get("status") or "present") if isinstance(item, dict) else None
            if not student_id or status not in STATUSES:
                raise serializers.ValidationError({"records": f"Invalid record: {item!r}"})
            cleaned[str(student_id)] = status  # one mark per student; the last one wins
        return cleaned

    def _save_records(self, session, records):
        if records is None:
            return
        students = {str(s.pk): s for s in Student.objects.filter(school=session.school, pk__in=list(records.keys()))}
        unknown = set(records) - set(students)
        if unknown:
            raise serializers.ValidationError({"records": "Some students do not belong to this school."})
        existing = {str(r.student_id): r for r in session.records.all()}
        to_create, to_update = [], []
        for student_id, status in records.items():
            record = existing.get(student_id)
            if record:
                if record.status != status:
                    record.status = status
                    to_update.append(record)
            else:
                to_create.append(
                    AttendanceRecord(
                        school=session.school, attendance_session=session, student=students[student_id], status=status
                    )
                )
        AttendanceRecord.objects.bulk_create(to_create)
        AttendanceRecord.objects.bulk_update(to_update, ["status"])

    @transaction.atomic
    def create(self, validated_data):
        records = validated_data.pop("_records", None)
        # Same class + date already has a register: update it rather than duplicating.
        session = AttendanceSession.objects.filter(
            school=validated_data.get("school"),
            student_class=validated_data["student_class"],
            date=validated_data["date"],
        ).first()
        if session:
            for field, value in validated_data.items():
                setattr(session, field, value)
            session.save()
        else:
            session = super().create(validated_data)
        self._save_records(session, records)
        return session

    @transaction.atomic
    def update(self, instance, validated_data):
        records = validated_data.pop("_records", None)
        session = super().update(instance, validated_data)
        self._save_records(session, records)
        return session
