from rest_framework import serializers
from .models import SchoolMessage, GlobalActivityLog, PlatformAnnouncement

class SchoolMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    recipient_role = serializers.CharField(source='recipient.role', read_only=True)

    class Meta:
        model = SchoolMessage
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'recipient', 'recipient_name', 
                  'recipient_role', 'subject', 'body', 'is_read', 'read_at', 'created_at', 'updated_at']
        read_only_fields = ['sender', 'read_at', 'created_at', 'updated_at']

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
