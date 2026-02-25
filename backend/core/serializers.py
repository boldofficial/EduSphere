from rest_framework import serializers
from .models import (
    SchoolMessage, Conversation, ConversationParticipant, 
    GlobalActivityLog, PlatformAnnouncement, Notification, SchoolAnnouncement, Newsletter
)

class ConversationParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ['id', 'user', 'user_name', 'user_role', 'last_read_at', 'is_archived', 'is_muted']

class SchoolMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = SchoolMessage
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_role', 
                  'body', 'attachment_url', 'is_system_generated', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']

class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'school', 'type', 'created_at', 'metadata', 'participants', 'last_message', 'unread_count']
        read_only_fields = ['id', 'school', 'created_at']

    def get_last_message(self, obj):
        # Use annotated fields from queryset if available (avoids N+1)
        if hasattr(obj, '_last_msg_body'):
            if obj._last_msg_body:
                return {
                    'body': obj._last_msg_body,
                    'sender_name': obj._last_msg_sender or '',
                    'created_at': obj._last_msg_time
                }
            return None
        # Fallback for non-annotated querysets
        last_msg = obj.messages.select_related('sender').order_by('-created_at').first()
        if last_msg:
            return {
                'body': last_msg.body,
                'sender_name': last_msg.sender.username,
                'created_at': last_msg.created_at
            }
        return None

    def get_unread_count(self, obj):
        # Use annotated field if available (avoids N+1)
        if hasattr(obj, '_unread_count'):
            return obj._unread_count or 0
        # Fallback
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        participant = obj.participants.filter(user=request.user).first()
        if not participant:
            return 0
        if not participant.last_read_at:
            return obj.messages.count()
        return obj.messages.filter(created_at__gt=participant.last_read_at).count()

class GlobalActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = GlobalActivityLog
        fields = ['id', 'action', 'school', 'school_name', 'user', 'user_name', 'description', 'metadata', 'created_at']
        read_only_fields = ['created_at']

class PlatformAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAnnouncement
        fields = ['id', 'title', 'message', 'priority', 'is_active', 'target_role', 'created_by', 'created_at', 'expires_at']
        read_only_fields = ['created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'category', 'link', 'is_read', 'created_at']
        read_only_fields = ['created_at']


class SchoolAnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = SchoolAnnouncement
        fields = '__all__'
        read_only_fields = ['school', 'author', 'created_at', 'updated_at']

class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = '__all__'
        read_only_fields = ['school', 'created_at', 'updated_at']
