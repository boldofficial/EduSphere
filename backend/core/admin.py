from django.contrib import admin
from .models import GlobalActivityLog, PlatformAnnouncement, SchoolMessage

@admin.register(GlobalActivityLog)
class GlobalActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'school', 'user', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('description', 'school__name', 'user__username')

@admin.register(PlatformAnnouncement)
class PlatformAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'priority', 'is_active', 'created_at')
    list_filter = ('priority', 'is_active')
