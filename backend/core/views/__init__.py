"""
Core views — split into domain-focused modules.
"""

from .settings import CustomDomainVerifyView, PublicSettingsView, PublicStatsView, SettingsView
from .files import FileUploadView, SiteMediaView
from .messaging import ConversationViewSet, SchoolMessageViewSet
from .activity import GlobalActivityLogViewSet
from .notifications import NotificationViewSet
from .announcements import NewsletterViewSet, SchoolAnnouncementViewSet
from .health import HealthCheckView

__all__ = [
    "SettingsView",
    "CustomDomainVerifyView",
    "PublicSettingsView",
    "PublicStatsView",
    "FileUploadView",
    "SiteMediaView",
    "ConversationViewSet",
    "SchoolMessageViewSet",
    "GlobalActivityLogViewSet",
    "NotificationViewSet",
    "SchoolAnnouncementViewSet",
    "NewsletterViewSet",
    "HealthCheckView",
]
