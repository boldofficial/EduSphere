from rest_framework import serializers
from .models import Feedback


from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True, default="")
    username = serializers.CharField(source="user.username", read_only=True, default="")
    guest_name = serializers.CharField(required=False, allow_blank=True)
    guest_email = serializers.EmailField(required=False, allow_blank=True)

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
            "guest_name",
            "guest_email",
            "created_at",
        ]
        read_only_fields = ["id", "school_name", "username", "created_at"]

    def validate(self, attrs):
        """Ensure guest_name and guest_email are provided for unauthenticated users."""
        request = self.context.get("request")
        is_guest = request and not request.user.is_authenticated

        if is_guest:
            if not attrs.get("guest_name", "").strip():
                raise serializers.ValidationError({"guest_name": "Name is required for guest feedback."})
            if not attrs.get("guest_email", "").strip():
                raise serializers.ValidationError({"guest_email": "Email is required for guest feedback."})

        return attrs
