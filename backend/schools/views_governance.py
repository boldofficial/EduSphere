"""
Governance & Announcements Views

Platform governance, activity logs, and user-facing announcements:
- PlatformGovernanceView
- UserAnnouncementsView
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from core.models import GlobalActivityLog, PlatformAnnouncement
import logging

logger = logging.getLogger(__name__)


class PlatformGovernanceView(APIView):
    """
    Platform Activity Logs and Announcements.
    Super Admin only.
    """
    permission_classes = [IsAuthenticated]

    def get_activities(self):
        logs = GlobalActivityLog.objects.select_related('school', 'user').all()[:50]
        return [{
            'id': log.id,
            'action': log.action,
            'school_name': log.school.name if log.school else 'Platform',
            'user_email': log.user.email if log.user else 'System',
            'description': log.description,
            'created_at': log.created_at
        } for log in logs]

    def get_announcements(self):
        announcements = PlatformAnnouncement.objects.all()
        return [{
            'id': ann.id,
            'title': ann.title,
            'message': ann.message,
            'priority': ann.priority,
            'is_active': ann.is_active,
            'created_at': ann.created_at
        } for ann in announcements]

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access platform governance')

        return Response({
            'activities': self.get_activities(),
            'announcements': self.get_announcements()
        })

    def post(self, request):
        """Create a new announcement."""
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can manage announcements')

        title = request.data.get('title')
        message = request.data.get('message')
        priority = request.data.get('priority', 'low')

        if not title or not message:
            raise ValidationError({'detail': 'Title and message are required'})

        announcement = PlatformAnnouncement.objects.create(
            title=title,
            message=message,
            priority=priority,
            created_by=request.user
        )

        return Response({
            'success': True,
            'id': announcement.id
        })


class UserAnnouncementsView(APIView):
    """Active announcements for the current user's role."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        announcements = PlatformAnnouncement.objects.filter(
            is_active=True,
            target_role=request.user.role
        ).order_by('-created_at')

        return Response([{
            'id': ann.id,
            'title': ann.title,
            'message': ann.message,
            'priority': ann.priority,
            'created_at': ann.created_at
        } for ann in announcements])
