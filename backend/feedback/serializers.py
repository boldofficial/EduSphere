from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True, default="")
    username = serializers.CharField(source="user.username", read_only=True, default="")

    class Meta:
        model = Feedback
        fields = [
            "id",
            "rating",
            "comment",
            "page_url",
            "user_role",
            "school_name",
            "username",
            "created_at",
        ]
        read_only_fields = ["id", "school_name", "username", "created_at"]
