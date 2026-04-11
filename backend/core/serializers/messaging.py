"""Messaging serializers."""

from rest_framework import serializers
from ..models import Conversation, ConversationParticipant, SchoolMessage


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ["id", "user", "user_name", "user_role", "last_read_at", "is_archived", "is_muted"]


class SchoolMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)

    class Meta:
        model = SchoolMessage
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "sender_role",
            "body",
            "attachment_url",
            "is_system_generated",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "sender", "created_at", "updated_at"]


class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "school", "type", "created_at", "metadata", "participants", "last_message", "unread_count"]
        read_only_fields = ["id", "school", "created_at"]

    def get_last_message(self, obj):
        if hasattr(obj, "_last_msg_body"):
            if obj._last_msg_body:
                return {
                    "body": obj._last_msg_body,
                    "sender_name": obj._last_msg_sender or "",
                    "created_at": obj._last_msg_time,
                }
            return None
        last_msg = obj.messages.select_related("sender").order_by("-created_at").first()
        if last_msg:
            return {"body": last_msg.body, "sender_name": last_msg.sender.username, "created_at": last_msg.created_at}
        return None

    def get_unread_count(self, obj):
        if hasattr(obj, "_unread_count"):
            return obj._unread_count or 0
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        participant = obj.participants.filter(user=request.user).first()
        if not participant:
            return 0
        if not participant.last_read_at:
            return obj.messages.count()
        return obj.messages.filter(created_at__gt=participant.last_read_at).count()
