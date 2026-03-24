from django.contrib import admin
from .models import DiscussionThread, DiscussionMessage

@admin.register(DiscussionThread)
class DiscussionThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "content_type", "object_id", "school", "created_at")
    list_filter = ("school", "content_type")

@admin.register(DiscussionMessage)
class DiscussionMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "thread", "author", "parent", "school", "created_at")
    list_filter = ("school", "author")
    search_fields = ("body",)
