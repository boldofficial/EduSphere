from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import DiscussionThread, DiscussionMessage

class DiscussionMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source="author.names")
    replies = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionMessage
        fields = [
            "id", "thread", "author", "author_name", "parent", 
            "body", "created_at", "replies"
        ]
        read_only_fields = ["author", "created_at"]

    def get_replies(self, obj):
        # Limit nesting depth or handle recursively if needed
        # For a start, we'll return immediate children
        serializer = DiscussionMessageSerializer(obj.replies.all(), many=True)
        return serializer.data

class DiscussionThreadSerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionThread
        fields = ["id", "content_type", "object_id", "created_at", "messages"]

    def get_messages(self, obj):
        # only fetch top-level messages (parent=None) to start the tree
        top_level_messages = obj.messages.filter(parent=None)
        return DiscussionMessageSerializer(top_level_messages, many=True).data
