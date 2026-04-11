"""Messaging views: ConversationViewSet and SchoolMessageViewSet."""

import logging
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from core.cache_utils import CachingMixin
from core.tenant_utils import get_request_school
from core.pagination import StandardPagination

from ..models import (
    Conversation,
    ConversationParticipant,
    Notification,
    SchoolMessage,
)
from ..serializers import (
    ConversationSerializer,
    SchoolMessageSerializer,
)

logger = logging.getLogger(__name__)


class ConversationViewSet(CachingMixin, viewsets.ModelViewSet):
    """
    Groups of participants and their messages.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Conversation.objects.none()

        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if not school:
            return Conversation.objects.none()

        # Subquery annotations to avoid N+1 in serializer
        from django.db.models import OuterRef, Subquery

        from users.models import User

        latest_msg = SchoolMessage.objects.filter(conversation=OuterRef("pk")).order_by("-created_at")

        # Get current user's last_read_at for unread calculation
        user_participant = ConversationParticipant.objects.filter(conversation=OuterRef("pk"), user=user)

        qs = (
            Conversation.objects.filter(school=school, participants__user=user)
            .annotate(
                _last_msg_body=Subquery(latest_msg.values("body")[:1]),
                _last_msg_sender=Subquery(
                    latest_msg.annotate(
                        _sender_name=Subquery(User.objects.filter(pk=OuterRef("sender_id")).values("username")[:1])
                    ).values("_sender_name")[:1]
                ),
                _last_msg_time=Subquery(latest_msg.values("created_at")[:1]),
                _user_last_read=Subquery(user_participant.values("last_read_at")[:1]),
            )
            .prefetch_related("participants__user")
            .order_by("-_last_msg_time", "-created_at")
            .distinct()
        )

        return qs

    def create(self, request, *args, **kwargs):
        """Custom create that handles duplicate prevention gracefully."""
        user = request.user
        school = get_request_school(request, allow_super_admin_tenant=True)
        if not school:
            return Response({"detail": "No school context found."}, status=400)

        participant_ids = request.data.get("participant_ids", [])
        conv_type = request.data.get("type", "DIRECT")

        # Enforce same-school participants only.
        if participant_ids:
            from users.models import User

            valid_participants = User.objects.filter(id__in=participant_ids, school=school).values_list("id", flat=True)
            valid_set = set(valid_participants)
            if len(valid_set) != len(set(participant_ids)):
                return Response({"detail": "All participants must belong to the same school."}, status=400)
            participant_ids = [pid for pid in participant_ids if pid in valid_set]

        # For DIRECT conversations, return existing one instead of creating duplicate
        if conv_type == "DIRECT" and len(participant_ids) == 1:
            other_id = participant_ids[0]
            existing = (
                Conversation.objects.filter(school=school, type="DIRECT", participants__user=user)
                .filter(participants__user_id=other_id)
                .first()
            )
            if existing:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=200)

        # Normal creation flow
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conv = serializer.save(school=school)

        # Add creator as participant
        ConversationParticipant.objects.create(user=user, conversation=conv)

        # Add other participants
        for pid in participant_ids:
            if pid != user.id:
                ConversationParticipant.objects.get_or_create(user_id=pid, conversation=conv)

        # Re-serialize to include participants
        out_serializer = self.get_serializer(conv)
        return Response(out_serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        conv = self.get_object()
        participant = conv.participants.filter(user=request.user).first()
        if participant:
            participant.last_read_at = timezone.now()
            participant.save()
            return Response({"status": "read"})
        return Response({"error": "not a participant"}, status=403)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        """Archive a conversation for the current user (soft delete)."""
        conv = self.get_object()
        participant = conv.participants.filter(user=request.user).first()
        if participant:
            participant.is_archived = True
            participant.save()
            return Response({"status": "archived"})
        return Response({"error": "not a participant"}, status=403)


class SchoolMessageViewSet(CachingMixin, viewsets.ModelViewSet):
    """Messaging within a conversation thread"""

    permission_classes = [IsAuthenticated]
    serializer_class = SchoolMessageSerializer
    pagination_class = StandardPagination
    cache_timeout = 30  # Low cache for active messaging

    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get("conversation")
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if not school:
            return SchoolMessage.objects.none()

        if not conversation_id:
            # Fallback for compatibility or global view (though grouped is better)
            return SchoolMessage.objects.filter(
                conversation__participants__user=user, conversation__school=school
            ).select_related("sender", "conversation")

        # High security: must be a participant
        if not ConversationParticipant.objects.filter(user=user, conversation_id=conversation_id).exists():
            return SchoolMessage.objects.none()

        return SchoolMessage.objects.filter(
            conversation_id=conversation_id, conversation__school=school
        ).select_related("sender")

    def perform_create(self, serializer):
        conversation = serializer.validated_data.get("conversation")
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        if school and conversation.school != school:
            raise PermissionDenied("Cross-tenant conversation access denied.")

        # Ensure participant or broadcast sender
        if not ConversationParticipant.objects.filter(user=self.request.user, conversation=conversation).exists():
            raise PermissionDenied("Not a participant in this conversation")

        msg = serializer.save(sender=self.request.user)

        # Update last_read_at for this participant
        ConversationParticipant.objects.filter(user=self.request.user, conversation=conversation).update(
            last_read_at=timezone.now()
        )

        # Auto-create notifications for other participants
        other_participants = (
            ConversationParticipant.objects.filter(conversation=conversation)
            .exclude(user=self.request.user)
            .select_related("user")
        )

        school = conversation.school
        if school:
            notifications = [
                Notification(
                    school=school,
                    user=p.user,
                    title=f"New message from {self.request.user.username}",
                    message=msg.body[:200],
                    category="system",
                    link="/dashboard/messages",
                )
                for p in other_participants
            ]
            Notification.objects.bulk_create(notifications)

    @action(detail=False, methods=["post"], url_path="ai-draft")
    def ai_draft(self, request):
        """
        AI-powered professional message drafting.
        Body: { "topic": str, "recipient_type": str, "key_points": str, "tone": "formal" }
        """
        from academic.ai_utils import AcademicAI

        school = get_request_school(request, allow_super_admin_tenant=True)
        school_name = school.name if school else "Our School"

        context = {
            "school_name": school_name,
            "recipient_type": request.data.get("recipient_type", "Parents"),
            "topic": request.data.get("topic", "General Update"),
            "key_points": request.data.get("key_points", ""),
        }
        tone = request.data.get("tone", "formal")

        try:
            ai = AcademicAI()
            if not ai.model:
                return Response(
                    {"error": "AI service is not configured. Please contact the administrator."}, status=503
                )

            draft = ai.draft_professional_message(context, tone=tone)

            if not draft:
                return Response({"error": "AI drafting failed. Please try again."}, status=503)

            return Response({"draft": draft})
        except Exception as e:
            logger.error(f"AI Draft Error: {str(e)}", exc_info=True)
            return Response({"error": f"An error occurred: {str(e)}"}, status=500)
