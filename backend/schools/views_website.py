"""Website contact form (public), enquiry inbox and website revision history (admins)."""

from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.pagination import StandardPagination
from core.permissions import AdminOnly
from core.tenant_utils import get_request_school
from core.website_content import apply_snapshot, snapshot

from .models import School, SchoolSettings, WebsiteEnquiry, WebsiteRevision

REVISIONS_KEPT = 30


def _public_school(request):
    domain = request.META.get("HTTP_X_TENANT_ID")
    if not domain and getattr(request, "tenant", None):
        return request.tenant
    if not domain:
        return None
    return School.objects.filter(Q(domain=domain) | Q(custom_domain=domain)).first()


def _notify_school(enquiry):
    """Email the school (its address and admins). Replying answers the parent directly."""
    from emails.notify import queue_template_email, school_recipients

    queue_template_email(
        "website_enquiry",
        school_recipients(enquiry.school),
        {
            "name": enquiry.name,
            "email": enquiry.email,
            "phone": enquiry.phone,
            "subject": enquiry.subject,
            "message": enquiry.message,
            "school_name": enquiry.school.name,
        },
        reply_to=enquiry.email,
    )


class PublicEnquiryView(APIView):
    """POST from a school website's contact form. Saved for the school and emailed to the school only."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "website_enquiry"

    def post(self, request):
        school = _public_school(request)
        if not school:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        # Honeypot: real visitors never see or fill this field; bots do. Pretend it worked.
        if str(data.get("website") or "").strip():
            return Response({"detail": "Thank you. Your message has been sent."}, status=status.HTTP_201_CREATED)

        clean = {
            "name": " ".join(str(data.get("name") or "").split())[:100],
            "email": str(data.get("email") or "").strip()[:150],
            "phone": " ".join(str(data.get("phone") or "").split())[:30],
            "subject": " ".join(str(data.get("subject") or "").split())[:200],
            "message": str(data.get("message") or "").strip(),
        }
        errors = {}
        if not clean["name"]:
            errors["name"] = ["Please enter your name."]
        try:
            validate_email(clean["email"])
        except DjangoValidationError:
            errors["email"] = ["Please enter a valid email address."]
        if not clean["message"]:
            errors["message"] = ["Please write a message."]
        elif len(clean["message"]) > 5000:
            errors["message"] = ["Please keep your message under 5,000 characters."]
        if errors:
            first = next(iter(errors.values()))[0]
            return Response({"detail": first, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        enquiry = WebsiteEnquiry.objects.create(school=school, **clean)
        _notify_school(enquiry)
        return Response(
            {"detail": "Thank you. Your message has been sent and the school will get back to you."},
            status=status.HTTP_201_CREATED,
        )


class WebsiteEnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteEnquiry
        fields = ["id", "name", "email", "phone", "subject", "message", "status", "created_at"]
        read_only_fields = ["id", "name", "email", "phone", "subject", "message", "created_at"]


class WebsiteEnquiryViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    permission_classes = [AdminOnly]
    serializer_class = WebsiteEnquirySerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        qs = WebsiteEnquiry.objects.filter(school=school) if school else WebsiteEnquiry.objects.none()
        wanted = self.request.query_params.get("status")
        if wanted == "open":
            qs = qs.exclude(status="archived")
        elif wanted:
            qs = qs.filter(status=wanted)
        return qs

    @action(detail=False, methods=["get"])
    def summary(self, request):
        return Response({"new": self.get_queryset().filter(status="new").count()})


class WebsiteRevisionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [AdminOnly]
    pagination_class = None

    def get_queryset(self):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        return WebsiteRevision.objects.filter(school=school) if school else WebsiteRevision.objects.none()

    def list(self, request, *args, **kwargs):
        rows = self.get_queryset().select_related("created_by")[:REVISIONS_KEPT]
        return Response(
            [
                {
                    "id": r.id,
                    "note": r.note,
                    "created_at": r.created_at,
                    "created_by": (r.created_by.get_full_name() or r.created_by.username) if r.created_by else "",
                }
                for r in rows
            ]
        )

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        revision = self.get_queryset().filter(pk=pk).first()
        if not revision:
            return Response({"detail": "Version not found."}, status=status.HTTP_404_NOT_FOUND)
        settings_obj, _ = SchoolSettings.objects.get_or_create(school=revision.school)
        with transaction.atomic():
            apply_snapshot(settings_obj, revision.data)
            record_revision(
                settings_obj, request.user, note=f"Restored version from {revision.created_at:%d %b %Y, %H:%M}"
            )
        return Response({"detail": "Website restored."})


def record_revision(settings_obj, user, note=""):
    """Save the current website as a revision and keep only the most recent ones."""
    WebsiteRevision.objects.create(
        school=settings_obj.school, data=snapshot(settings_obj), note=note[:120], created_by=user
    )
    stale = WebsiteRevision.objects.filter(school=settings_obj.school).values_list("id", flat=True)[REVISIONS_KEPT:]
    WebsiteRevision.objects.filter(id__in=list(stale)).delete()
