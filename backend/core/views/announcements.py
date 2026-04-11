"""Announcement and Newsletter views."""

import logging
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from core.cache_utils import CachingMixin
from core.tenant_utils import get_request_school
from core.pagination import StandardPagination

from ..models import Newsletter, SchoolAnnouncement
from ..serializers import NewsletterSerializer, SchoolAnnouncementSerializer

logger = logging.getLogger(__name__)


class SchoolAnnouncementViewSet(CachingMixin, viewsets.ModelViewSet):
    """School-specific announcements"""

    permission_classes = [IsAuthenticated]
    serializer_class = SchoolAnnouncementSerializer
    pagination_class = StandardPagination
    cache_timeout = 300  # 5 minutes

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return SchoolAnnouncement.objects.none()

        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if not school:
            return SchoolAnnouncement.objects.none()

        qs = SchoolAnnouncement.objects.filter(school=school)

        # Staff/Admins see all (including inactive), others only see active
        if user.role not in ("SUPER_ADMIN", "SCHOOL_ADMIN", "STAFF", "TEACHER"):
            qs = qs.filter(is_active=True)

        return qs.select_related("author", "school")

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if not school:
            raise ValidationError({"detail": "Cannot create announcement: no school context found."})
        serializer.save(author=self.request.user, school=school, author_role=self.request.user.role)


class NewsletterViewSet(CachingMixin, viewsets.ModelViewSet):
    """School newsletters"""

    permission_classes = [IsAuthenticated]
    serializer_class = NewsletterSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Newsletter.objects.none()

        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if not school:
            return Newsletter.objects.none()

        qs = Newsletter.objects.filter(school=school)

        # Staff/Admins see all (including unpublished), others only see published
        if user.role not in ("SUPER_ADMIN", "SCHOOL_ADMIN", "STAFF", "TEACHER"):
            qs = qs.filter(is_published=True)

        return qs.select_related("school")

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school:
            serializer.save(school=school)

    @action(detail=False, methods=["post"], url_path="ai-generate")
    def ai_generate(self, request):
        """
        AI-powered newsletter content generation.
        Body: { "period": "February 2026" }
        """
        from academic.ai_utils import AcademicAI
        from academic.models import SchoolEvent, Student, StudentAchievement, Teacher

        try:
            school = get_request_school(request, allow_super_admin_tenant=True)
            if not school:
                return Response({"error": "School not found"}, status=400)

            period = request.data.get("period", "This Month")

            # Gather school data for the AI
            events = list(
                SchoolEvent.objects.filter(school=school)
                .order_by("-start_date")[:10]
                .values("title", "event_type", "start_date")
            )
            achievements = list(
                StudentAchievement.objects.filter(school=school)
                .order_by("-date_achieved")[:5]
                .values("title", "category")
            )
            stats = {
                "total_students": Student.objects.filter(school=school, status="active").count(),
                "total_teachers": Teacher.objects.filter(school=school).count(),
            }

            school_data = {
                "school_name": school.name,
                "period": period,
                "events": [{"title": e["title"], "type": e["event_type"]} for e in events],
                "achievements": [{"title": a["title"], "category": a["category"]} for a in achievements],
                "stats": stats,
            }

            ai = AcademicAI()
            if not ai.model:
                return Response(
                    {"error": "AI service is not configured. Please set the GEMINI_API_KEY in the server environment."},
                    status=503,
                )

            content = ai.synthesize_newsletter(school_data)

            if not content:
                return Response(
                    {"error": "AI newsletter generation failed. The AI service may be temporarily unavailable."},
                    status=503,
                )

            return Response({"content": content, "title": f"{school.name} Newsletter - {period}"})
        except Exception as e:
            logger.error(f"Newsletter AI Generate Error: {str(e)}", exc_info=True)
            return Response({"error": f"An error occurred: {str(e)}"}, status=500)
