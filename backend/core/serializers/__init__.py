"""
Core serializers package.
Re-exports serializers for backward compatibility.
"""

from .messaging import (
    ConversationParticipantSerializer,
    SchoolMessageSerializer,
    ConversationSerializer,
)
from .activity import GlobalActivityLogSerializer
from .announcements import (
    PlatformAnnouncementSerializer,
    SchoolAnnouncementSerializer,
    NewsletterSerializer,
)
from .notifications import NotificationSerializer

__all__ = [
    "ConversationParticipantSerializer",
    "SchoolMessageSerializer",
    "ConversationSerializer",
    "GlobalActivityLogSerializer",
    "PlatformAnnouncementSerializer",
    "SchoolAnnouncementSerializer",
    "NewsletterSerializer",
    "NotificationSerializer",
]
