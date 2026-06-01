from django.contrib import admin
from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ["title", "status", "author_name", "published_at", "created_at"]
    list_filter = ["status"]
    search_fields = ["title", "excerpt"]
    prepopulated_fields = {"slug": ["title"]}
