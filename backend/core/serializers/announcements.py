"""Announcement and Newsletter serializers."""

from rest_framework import serializers
from ..models import PlatformAnnouncement, SchoolAnnouncement, Newsletter


class PlatformAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAnnouncement
        fields = [
            "id",
            "title",
            "message",
            "priority",
            "is_active",
            "target_role",
            "created_by",
            "created_at",
            "expires_at",
        ]
        read_only_fields = ["created_at"]


class SchoolAnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = SchoolAnnouncement
        fields = "__all__"
        read_only_fields = ["school", "author", "created_at", "updated_at"]


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = "__all__"
        read_only_fields = ["school", "created_at", "updated_at"]
