from rest_framework import serializers
from .models import SchoolMessage

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
