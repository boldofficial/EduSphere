from rest_framework import serializers
from .models import BlogPost, Category, Tag


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "post_count"]
        read_only_fields = ["id", "slug"]

    def get_post_count(self, obj):
        return obj.posts.filter(status="published").count()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]
        read_only_fields = ["id", "slug"]


class BlogPostSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    tags_list = TagSerializer(source="tags", many=True, read_only=True)

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
            "category",
            "category_name",
            "tags",
            "tags_list",
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
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    tags_list = TagSerializer(source="tags", many=True, read_only=True)

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
            "category",
            "category_name",
            "tags_list",
            "author_name",
            "published_at",
            "seo_title",
            "seo_description",
        ]
