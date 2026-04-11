"""Activity log serializers."""

from rest_framework import serializers
from ..models import GlobalActivityLog


class GlobalActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True)

    class Meta:
        model = GlobalActivityLog
        fields = ["id", "action", "school", "school_name", "user", "user_name", "description", "metadata", "created_at"]
        read_only_fields = ["created_at"]
