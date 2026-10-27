"""School settings views: SettingsView, PublicSettingsView, PublicStatsView."""

import logging

from django.db.models import Q
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError

from core.tenant_utils import get_request_school
from core.media_utils import get_media_url
from schools.models import School, SchoolDomain, SchoolSettings
from schools.serializers import SchoolSettingsSerializer
from schools.domain_service import refresh_custom_domain, setup_payload

logger = logging.getLogger(__name__)
SETTINGS_VERSION = "1.0.2"


class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_school(self, request):
        return get_request_school(request, allow_super_admin_tenant=True)

    def get(self, request):
        try:
            school = self.get_school(request)
            if not school:
                return Response(
                    {
                        "school_name": "Registra Platform",
                        "subscription_status": "active",
                        "current_session": "2025/2026",
                    }
                )

            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)

            sub_status = "none"
            if hasattr(school, "subscription"):
                sub_status = school.subscription.status

            # Merge School and Settings data
            domain_setup = setup_payload(school)
            return Response(
                {
                    "id": str(settings_obj.id),
                    "school_name": school.name,
                    "school_address": school.address or "",
                    "school_email": school.email or "",
                    "school_phone": school.phone or "",
                    "school_tagline": settings_obj.school_tagline or "",
                    "logo_media": get_media_url(school.logo),
                    "current_session": settings_obj.current_session,
                    "current_term": settings_obj.current_term,
                    "watermark_media": get_media_url(settings_obj.watermark_media),
                    "director_name": settings_obj.director_name or "",
                    "director_signature": get_media_url(settings_obj.director_signature),
                    "head_of_school_name": settings_obj.head_of_school_name or "",
                    "head_of_school_signature": get_media_url(settings_obj.head_of_school_signature),
                    "subjects_global": settings_obj.subjects_global,
                    "terms": settings_obj.terms_list,
                    "show_position": settings_obj.show_position,
                    "show_skills": settings_obj.show_skills,
                    "tiled_watermark": settings_obj.tiled_watermark,
                    "next_term_begins": (
                        settings_obj.next_term_begins.isoformat()
                        if settings_obj.next_term_begins and hasattr(settings_obj.next_term_begins, "isoformat")
                        else None
                    ),
                    "class_teacher_label": settings_obj.class_teacher_label,
                    "head_teacher_label": settings_obj.head_teacher_label,
                    "report_font_family": settings_obj.report_font_family,
                    "report_scale": settings_obj.report_scale,
                    "landing_hero_title": settings_obj.landing_hero_title or "",
                    "landing_hero_subtitle": settings_obj.landing_hero_subtitle or "",
                    "landing_features": settings_obj.landing_features or "",
                    "landing_about_text": settings_obj.landing_about_text or "",
                    "landing_about_eyebrow": settings_obj.landing_about_eyebrow or "",
                    "landing_about_title": settings_obj.landing_about_title or "",
                    "landing_about_html": settings_obj.landing_about_html or "",
                    "landing_about_primary_image": get_media_url(settings_obj.landing_about_primary_image),
                    "landing_about_secondary_image": get_media_url(settings_obj.landing_about_secondary_image),
                    "landing_about_image_position": settings_obj.landing_about_image_position,
                    "landing_hero_image": get_media_url(settings_obj.landing_hero_image),
                    "landing_gallery_images": [get_media_url(img) for img in settings_obj.landing_gallery_images],
                    "landing_primary_color": settings_obj.landing_primary_color,
                    "landing_show_stats": settings_obj.landing_show_stats,
                    "landing_cta_text": settings_obj.landing_cta_text,
                    "landing_core_values": settings_obj.landing_core_values,
                    "landing_academic_programs": [
                        {**p, "image": get_media_url(p.get("image"))} for p in settings_obj.landing_academic_programs
                    ],
                    "landing_testimonials": [
                        {**t, "image": get_media_url(t.get("image"))} for t in settings_obj.landing_testimonials
                    ],
                    "landing_stats_config": settings_obj.landing_stats_config,
                    "landing_custom_enabled": settings_obj.landing_custom_enabled,
                    "landing_custom_html": settings_obj.landing_custom_html or "",
                    "landing_custom_css": settings_obj.landing_custom_css or "",
                    "landing_sections": settings_obj.landing_sections or [],
                    "gallery": public_gallery(school),
                    "landing_theme": settings_obj.landing_theme or {},
                    "landing_stats": settings_obj.landing_stats or [],
                    "landing_team": [
                        {**m, "image": get_media_url(m.get("image"))} for m in (settings_obj.landing_team or [])
                    ],
                    "landing_faqs": settings_obj.landing_faqs or [],
                    "landing_social": settings_obj.landing_social or {},
                    "landing_opening_hours": settings_obj.landing_opening_hours or "",
                    "events": public_events(school),
                    "promotion_threshold": settings_obj.promotion_threshold,
                    "promotion_rules": settings_obj.promotion_rules,
                    "show_bank_details": settings_obj.show_bank_details,
                    "bank_name": settings_obj.bank_name or "",
                    "bank_account_name": settings_obj.bank_account_name or "",
                    "bank_account_number": settings_obj.bank_account_number or "",
                    "bank_sort_code": settings_obj.bank_sort_code or "",
                    "invoice_notes": settings_obj.invoice_notes or "",
                    "invoice_due_days": settings_obj.invoice_due_days,
                    "role_permissions": settings_obj.role_permissions,
                    "subscription_status": sub_status,
                    "domain": school.domain,
                    "custom_domain": domain_setup["hostname"] if domain_setup else school.custom_domain,
                    "custom_domain_setup": domain_setup,
                    "custom_domain_allowed": school.custom_domain_allowed,
                    "subscription": {
                        "status": sub_status,
                        "plan": {
                            "custom_domain_enabled": (
                                school.subscription.plan.custom_domain_enabled
                                if hasattr(school, "subscription") and school.subscription and school.subscription.plan
                                else False
                            )
                        },
                    },
                    "api_version": SETTINGS_VERSION,
                }
            )
        except PermissionDenied:
            raise
        except Exception as e:
            logger.exception("Failed to load school settings: %s", e)
            return Response({"error": "Failed to load settings"}, status=500)

    def put(self, request):
        # Security: Only authenticated admins can update settings
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
        if request.user.role not in ("SCHOOL_ADMIN", "SUPER_ADMIN") and not request.user.is_superuser:
            return Response({"error": "Only admins can update settings"}, status=403)

        school = self.get_school(request)
        if not school:
            return Response({"error": "School not found"}, status=404)

        try:
            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
            serializer = SchoolSettingsSerializer(
                instance=settings_obj, data=request.data, partial=True, context={"request": request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            if set(request.data) & set(WEBSITE_FIELDS) or "logo_media" in request.data:
                from schools.views_website import record_revision

                settings_obj.refresh_from_db()
                record_revision(settings_obj, request.user, note="Published")

            return self.get(request)
        except ValidationError as e:
            # Surface field errors (e.g. custom-domain gating) instead of a generic 400.
            return Response({"errors": e.detail}, status=400)
        except Exception as e:
            logger.exception("Settings update FAILED for school %s", school.domain)
            return Response(
                {
                    "error": "Failed to save settings",
                    "detail": str(e),
                },
                status=400,
            )


class CustomDomainVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("SCHOOL_ADMIN", "SUPER_ADMIN") and not request.user.is_superuser:
            return Response({"error": "Only admins can verify domains"}, status=403)
        school = get_request_school(request, allow_super_admin_tenant=True)
        if not school:
            return Response({"error": "School not found"}, status=404)
        if not school.custom_domain_allowed and not (request.user.is_superuser or request.user.role == "SUPER_ADMIN"):
            return Response({"error": "Custom domains require an active eligible plan"}, status=403)
        try:
            setup = school.custom_domain_setup
        except SchoolDomain.DoesNotExist:
            return Response({"error": "Add a custom domain before checking it"}, status=404)
        refresh_custom_domain(setup)
        school.refresh_from_db()
        return Response({"custom_domain": school.custom_domain, "custom_domain_setup": setup_payload(school)})


from core.website_content import WEBSITE_FIELDS  # noqa: E402

GALLERY_LIMIT = 120


def public_events(school, limit=6):
    """Upcoming calendar events the school chose to show on its website."""
    from django.utils import timezone

    from academic.models import SchoolEvent

    now = timezone.now()
    events = (
        SchoolEvent.objects.filter(school=school, show_on_website=True)
        .filter(Q(start_date__gte=now) | Q(end_date__gte=now))
        .order_by("start_date")[:limit]
    )
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": (e.description or "")[:300],
            "start_date": e.start_date,
            "end_date": e.end_date,
            "event_type": e.event_type,
        }
        for e in events
    ]


def public_gallery(school):
    """Gallery photos for the public site, in the admin's order. Shipped with the settings so the page renders once."""
    from core.website_media import public_url
    from schools.models import WebsiteMedia

    items = WebsiteMedia.objects.filter(school=school, show_in_gallery=True).order_by("position", "-created_at")
    return [
        {
            "id": m.id,
            "url": public_url(m.path),
            "thumb_url": public_url(m.thumb_path or m.path),
            "width": m.width,
            "height": m.height,
            "alt": m.alt_text or m.caption or school.name,
            "caption": m.caption,
            "album": m.album,
        }
        for m in items[:GALLERY_LIMIT]
    ]


class PublicSettingsView(APIView):
    """
    Lightweight, unauthenticated endpoint for SEO metadata and landing pages.
    Returns ONLY safe public fields — no bank details, no permissions, no internal config.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        domain = request.META.get("HTTP_X_TENANT_ID")
        if not domain and getattr(request, "tenant", None):
            domain = request.tenant.custom_domain or request.tenant.domain
        if not domain:
            domain = "demo"
        try:
            school = School.objects.get(Q(domain=domain) | Q(custom_domain=domain))
            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
            subscription_status = school.subscription.status if hasattr(school, "subscription") else "none"

            return Response(
                {
                    "school_name": school.name,
                    "school_tagline": settings_obj.school_tagline or "",
                    "school_email": school.email or "",
                    "school_phone": school.phone or "",
                    "school_address": school.address or "",
                    "logo_media": get_media_url(school.logo),
                    "landing_hero_title": settings_obj.landing_hero_title or "",
                    "landing_hero_subtitle": settings_obj.landing_hero_subtitle or "",
                    "landing_features": settings_obj.landing_features or "",
                    "landing_hero_image": get_media_url(settings_obj.landing_hero_image),
                    "landing_about_text": settings_obj.landing_about_text or "",
                    "landing_about_eyebrow": settings_obj.landing_about_eyebrow or "",
                    "landing_about_title": settings_obj.landing_about_title or "",
                    "landing_about_html": settings_obj.landing_about_html or "",
                    "landing_about_primary_image": get_media_url(settings_obj.landing_about_primary_image),
                    "landing_about_secondary_image": get_media_url(settings_obj.landing_about_secondary_image),
                    "landing_about_image_position": settings_obj.landing_about_image_position,
                    "landing_gallery_images": [get_media_url(img) for img in settings_obj.landing_gallery_images],
                    "landing_primary_color": settings_obj.landing_primary_color,
                    "landing_show_stats": settings_obj.landing_show_stats,
                    "landing_cta_text": settings_obj.landing_cta_text,
                    "landing_core_values": settings_obj.landing_core_values,
                    "landing_academic_programs": [
                        {**program, "image": get_media_url(program.get("image"))}
                        for program in settings_obj.landing_academic_programs
                    ],
                    "landing_testimonials": [
                        {**testimonial, "image": get_media_url(testimonial.get("image"))}
                        for testimonial in settings_obj.landing_testimonials
                    ],
                    "landing_stats_config": settings_obj.landing_stats_config,
                    "landing_custom_enabled": settings_obj.landing_custom_enabled,
                    "landing_custom_html": settings_obj.landing_custom_html or "",
                    "landing_custom_css": settings_obj.landing_custom_css or "",
                    "landing_sections": settings_obj.landing_sections or [],
                    "gallery": public_gallery(school),
                    "landing_theme": settings_obj.landing_theme or {},
                    "landing_stats": settings_obj.landing_stats or [],
                    "landing_team": [
                        {**m, "image": get_media_url(m.get("image"))} for m in (settings_obj.landing_team or [])
                    ],
                    "landing_faqs": settings_obj.landing_faqs or [],
                    "landing_social": settings_obj.landing_social or {},
                    "landing_opening_hours": settings_obj.landing_opening_hours or "",
                    "events": public_events(school),
                    "subscription_status": subscription_status,
                    "domain": school.domain,
                }
            )
        except Exception:
            return Response(
                {
                    "school_name": "Registra",
                    "school_tagline": "The operating system for modern schools",
                    "logo_media": None,
                }
            )


class PublicStatsView(APIView):
    """
    Publicly accessible statistics for a school landing page.
    Returns counts of students, teachers, and classes.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        domain = request.META.get("HTTP_X_TENANT_ID", "demo")

        try:
            from academic.models import Class, Student, Teacher
            from schools.models import School

            school = School.objects.get(domain=domain)

            return Response(
                {
                    "students_count": Student.objects.filter(school=school).count(),
                    "teachers_count": Teacher.objects.filter(school=school).count(),
                    "classes_count": Class.objects.filter(school=school).count(),
                }
            )
        except Exception:
            # Fallback counts for demo
            return Response(
                {
                    "students_count": 1250,
                    "teachers_count": 45,
                    "classes_count": 24,
                }
            )
