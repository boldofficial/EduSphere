"""
Core views — split into domain-focused modules.
"""

from .settings import PublicSettingsView, PublicStatsView, SettingsView
from .files import FileUploadView
from .messaging import ConversationViewSet, SchoolMessageViewSet
from .notifications import NotificationViewSet
from .announcements import NewsletterViewSet, SchoolAnnouncementViewSet

__all__ = [
    "SettingsView",
    "PublicSettingsView",
    "PublicStatsView",
    "FileUploadView",
    "ConversationViewSet",
    "SchoolMessageViewSet",
    "NotificationViewSet",
    "SchoolAnnouncementViewSet",
    "NewsletterViewSet",
]
