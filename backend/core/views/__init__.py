"""
Core views — split into domain-focused modules.
"""

from .settings import PublicSettingsView, PublicStatsView, SettingsView
from .files import FileUploadView
from .messaging import ConversationViewSet, SchoolMessageViewSet
from .activity import GlobalActivityLogViewSet
from .notifications import NotificationViewSet
from .announcements import NewsletterViewSet, SchoolAnnouncementViewSet
from .health import HealthCheckView

__all__ = [
    "SettingsView",
    "PublicSettingsView",
    "PublicStatsView",
    "FileUploadView",
    "ConversationViewSet",
    "SchoolMessageViewSet",
    "GlobalActivityLogViewSet",
    "NotificationViewSet",
    "SchoolAnnouncementViewSet",
    "NewsletterViewSet",
    "HealthCheckView",
]
