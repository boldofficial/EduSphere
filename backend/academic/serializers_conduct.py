from rest_framework import serializers
from academic.models import (
    Student, Subject, GradingScheme,
    Commendation, ConductWarning, BehaviorAnalytics,
    ConductEntry
)
from users.serializers import UserSerializer


class CommendationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    awarded_by_name = serializers.CharField(source="awarded_by.username", read_only=True)
    
    class Meta:
        model = Commendation
        fields = [
            "id", "student", "student_name", "title", "description", "category",
            "points", "award_date", "awarded_by", "awarded_by_name",
            "evidence_url", "certificate_number", "session", "term", "created_at"
        ]


class CommendationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commendation
        fields = [
            "student", "title", "description", "category", "points",
            "evidence_url", "session", "term"
        ]
    
    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["awarded_by"] = user
        return super().create(validated_data)


class ConductWarningSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.username", read_only=True)
    
    class Meta:
        model = ConductWarning
        fields = [
            "id", "student", "student_name", "incident_type", "severity",
            "description", "incident_date", "action_taken", "parent_notified",
            "parent_notification_method", "parent_response", "status",
            "recorded_by", "recorded_by_name", "session", "term", "created_at"
        ]


class ConductWarningCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConductWarning
        fields = [
            "student", "incident_type", "severity", "description",
            "incident_date", "action_taken", "parent_notified",
            "parent_notification_method", "parent_response", "session", "term"
        ]
    
    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["recorded_by"] = user
        return super().create(validated_data)


class BehaviorAnalyticsSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    
    class Meta:
        model = BehaviorAnalytics
        fields = [
            "id", "student", "student_name", "session", "term",
            "avg_conduct_score", "total_commendations", "total_warnings",
            "trait_scores", "commendation_points", "warning_points",
            "overall_rating", "parent_meetings", "parent_complaints", "updated_at"
        ]


class ConductEntrySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.username", read_only=True)
    
    class Meta:
        model = ConductEntry
        fields = ["id", "student", "trait", "score", "remark", "date", "recorded_by", "recorded_by_name"]


class ConductEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConductEntry
        fields = ["student", "trait", "score", "remark", "date"]
    
    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["recorded_by"] = user
        return super().create(validated_data)


class BehaviorSummarySerializer(serializers.Serializer):
    """Aggregated behavior data for a student."""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    session = serializers.CharField()
    term = serializers.CharField(required=False)
    
    total_commendations = serializers.IntegerField()
    total_warnings = serializers.IntegerField()
    commendation_points = serializers.IntegerField()
    warning_points = serializers.IntegerField()
    avg_conduct_score = serializers.FloatField()
    overall_rating = serializers.CharField()
    
    recent_commendations = CommendationSerializer(many=True)
    recent_warnings = ConductWarningSerializer(many=True)