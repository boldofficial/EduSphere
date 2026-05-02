"""Announcement and Newsletter views."""

import logging
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from core.cache_utils import CachingMixin
from core.tenant_utils import get_request_school
from core.pagination import StandardPagination

from ..models import Newsletter, Notification, SchoolAnnouncement
from ..serializers import NewsletterSerializer, SchoolAnnouncementSerializer

logger = logging.getLogger(__name__)


def _recipient_q_for_announcement_target(announcement: SchoolAnnouncement) -> Q:
    target = (announcement.target or "all").lower()
    if target == "teachers":
        return Q(role="TEACHER")
    if target == "staff":
        return Q(role="STAFF")
    if target == "parents":
        return Q(role="PARENT")
    if target == "class" and announcement.class_id:
        # Class-targeted alerts go to students in that class.
        return Q(student_profile__current_class_id=announcement.class_id)
    return Q()


def _create_announcement_notifications(announcement: SchoolAnnouncement, actor_id: int | None = None) -> None:
    from users.models import User

    base_qs = User.objects.filter(
        school=announcement.school,
        is_active=True,
    )
    role_filter = _recipient_q_for_announcement_target(announcement)
    if role_filter:
        base_qs = base_qs.filter(role_filter)
    if actor_id:
        base_qs = base_qs.exclude(id=actor_id)

    recipient_ids = list(base_qs.distinct().values_list("id", flat=True))
    if not recipient_ids:
        return

    Notification.objects.bulk_create(
        [
            Notification(
                school=announcement.school,
                user_id=user_id,
                title=f"New announcement: {announcement.title}",
                message=announcement.content[:220],
                category="announcement",
                link="/announcements",
            )
            for user_id in recipient_ids
        ]
    )


def _create_newsletter_notifications(newsletter: Newsletter, actor_id: int | None = None) -> None:
    if not newsletter.is_published:
        return

    from users.models import User

    recipient_ids = list(
        User.objects.filter(school=newsletter.school, is_active=True).exclude(id=actor_id).values_list("id", flat=True)
    )
    if not recipient_ids:
        return

    Notification.objects.bulk_create(
        [
            Notification(
                school=newsletter.school,
                user_id=user_id,
                title=f"New newsletter: {newsletter.title}",
                message=f"{newsletter.term} {newsletter.session} newsletter is now available.",
                category="system",
                link="/newsletter",
            )
            for user_id in recipient_ids
        ]
    )


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
        announcement = serializer.save(author=self.request.user, school=school, author_role=self.request.user.role)
        _create_announcement_notifications(announcement, actor_id=self.request.user.id)


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
            newsletter = serializer.save(school=school)
            _create_newsletter_notifications(newsletter, actor_id=self.request.user.id)

    def perform_update(self, serializer):
        old_instance = self.get_object()
        was_published = bool(old_instance.is_published)
        newsletter = serializer.save()
        if not was_published and newsletter.is_published:
            _create_newsletter_notifications(newsletter, actor_id=self.request.user.id)

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
