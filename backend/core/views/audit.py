"""Audit trail for school admins: who changed scores, report cards, students, payments and fees."""

from datetime import datetime, time

from django.apps import apps
from django.db import models
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.audit import AREAS, RECORD
from core.pagination import StandardPagination
from core.permissions import AdminOnly
from core.tenant_utils import get_request_school

from ..models import FieldChangeLog

ACTION_TEXT = {"CREATE": "Created", "UPDATE": "Changed", "DELETE": "Deleted"}


def _field_meta(content_type, field_name):
    """(label, related model or None, is a date/time) for a stored field name."""
    if field_name == RECORD:
        return "", None, False
    try:
        field = apps.get_model(content_type)._meta.get_field(field_name)
    except Exception:
        return field_name.replace("_", " ").capitalize(), None, False
    label = str(getattr(field, "verbose_name", field_name)).replace("_", " ")
    related = field.related_model if getattr(field, "many_to_one", False) else None
    is_time = isinstance(field, (models.DateTimeField, models.DateField))
    return label[:1].upper() + label[1:], related, is_time


def _readable_time(value):
    """'2026-10-16 09:10:20.68+00:00' -> '16 Oct 2026, 10:10' (school's time zone); dates -> '16 Oct 2026'."""
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return value
    if len(value) <= 10:
        return f"{parsed.day} {parsed:%b %Y}"
    if timezone.is_aware(parsed):
        parsed = timezone.localtime(parsed)
    return f"{parsed.day} {parsed:%b %Y, %H:%M}"


def _labels_for_unlabelled(page, school):
    """Entries written before labels existed: describe the record now, if it still exists."""
    from core.audit import record_label

    missing = {}
    for row in page:
        if not row.object_label and row.object_id.isdigit():
            missing.setdefault(row.content_type, set()).add(int(row.object_id))
    labels = {}
    for content_type, ids in missing.items():
        try:
            for obj in apps.get_model(content_type).objects.filter(pk__in=ids, school=school):
                labels[(content_type, str(obj.pk))] = record_label(obj)
        except Exception:
            continue
    return labels


def _parse_day(value, end=False):
    try:
        day = datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None
    return timezone.make_aware(datetime.combine(day, time.max if end else time.min))


class AuditTrailView(APIView):
    """
    GET /api/core/audit-trail/ — this school's change history, newest first.
    Filters: area (Scores, Report cards, Students, Payments, Fees), user (id), action
    (CREATE/UPDATE/DELETE), q (student, subject, receipt…), from/to (YYYY-MM-DD).
    """

    permission_classes = [permissions.IsAuthenticated, AdminOnly]

    def get(self, request):
        school = get_request_school(request)
        qs = FieldChangeLog.objects.filter(school=school).select_related("user")

        area = request.query_params.get("area")
        if area:
            qs = qs.filter(content_type__in=[k for k, v in AREAS.items() if v == area])
        if request.query_params.get("user"):
            qs = qs.filter(user_id=request.query_params["user"])
        if request.query_params.get("action") in ACTION_TEXT:
            qs = qs.filter(action=request.query_params["action"])
        if request.query_params.get("q"):
            q = request.query_params["q"].strip()
            qs = qs.filter(Q(object_label__icontains=q) | Q(old_value__icontains=q) | Q(new_value__icontains=q))
        start = _parse_day(request.query_params.get("from"))
        end = _parse_day(request.query_params.get("to"), end=True)
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs.order_by("-created_at", "-id"), request, view=self)

        # Show names, not ids, for changed links (e.g. a student's class): one query per related model.
        metas = {(row.content_type, row.field_name): _field_meta(row.content_type, row.field_name) for row in page}
        wanted = {}
        for row in page:
            related = metas[(row.content_type, row.field_name)][1]
            if related is not None:
                wanted.setdefault(related, set()).update(v for v in (row.old_value, row.new_value) if v)
        names = {}
        for model, ids in wanted.items():
            try:
                found = model.objects.filter(pk__in=[i for i in ids if str(i).isdigit()])
                if "school" in {f.name for f in model._meta.concrete_fields}:
                    found = found.filter(school=school)
                # Prefer the plain name ("JSS 1") over str(), which often adds the school.
                names[model] = {
                    str(obj.pk): str(getattr(obj, "name", None) or getattr(obj, "names", None) or obj) for obj in found
                }
            except Exception:
                names[model] = {}

        def shown(value, related, is_time):
            if value is None:
                return value
            if is_time:
                return _readable_time(value)
            if related is None:
                return value
            return names.get(related, {}).get(str(value), value)

        late_labels = _labels_for_unlabelled(page, school)

        rows = []
        for row in page:
            label, related, is_time = metas[(row.content_type, row.field_name)]
            user = row.user
            rows.append(
                {
                    "id": row.id,
                    "at": row.created_at,
                    "action": row.action,
                    "action_text": ACTION_TEXT.get(row.action, row.action),
                    "area": AREAS.get(row.content_type, row.content_type),
                    "record": row.object_label
                    or late_labels.get((row.content_type, row.object_id))
                    or f"{AREAS.get(row.content_type, row.content_type)} record #{row.object_id} (since removed)",
                    "field": label,
                    "old": shown(row.old_value, related, is_time),
                    "new": shown(row.new_value, related, is_time),
                    "user": (
                        {"id": user.id, "name": user.get_full_name() or user.username, "role": user.role}
                        if user
                        else None
                    ),
                    "ip": row.ip_address,
                }
            )
        return paginator.get_paginated_response(rows)


class AuditTrailPeopleView(APIView):
    """GET /api/core/audit-trail/people/ — who has made changes (for the filter), most active first."""

    permission_classes = [permissions.IsAuthenticated, AdminOnly]

    def get(self, request):
        school = get_request_school(request)
        people = (
            FieldChangeLog.objects.filter(school=school, user__isnull=False)
            .values("user_id", "user__username", "user__first_name", "user__last_name", "user__role")
            .annotate(changes=Count("id"))
            .order_by("-changes")[:200]
        )
        return Response(
            [
                {
                    "id": p["user_id"],
                    "name": f"{p['user__first_name']} {p['user__last_name']}".strip() or p["user__username"],
                    "role": p["user__role"],
                    "changes": p["changes"],
                }
                for p in people
            ]
        )
