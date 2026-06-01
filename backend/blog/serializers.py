from rest_framework import serializers
from .models import BlogPost


class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "content_json",
            "content_html",
            "excerpt",
            "featured_image",
            "author_name",
            "status",
            "published_at",
            "seo_title",
            "seo_description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "published_at", "created_at", "updated_at"]


class BlogPostPublicSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public listing (no draft content leaked)."""

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "content_json",
            "content_html",
            "excerpt",
            "featured_image",
            "author_name",
            "published_at",
            "seo_title",
            "seo_description",
        ]
