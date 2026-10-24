"""
Audit trail: who changed which record, when, and from what to what.

The signed-in user is captured when the request is authenticated (core.authentication) and held in a
context variable for the rest of the request, so model saves deep inside serializers and tasks are
attributed without passing the user around. Tracked models use core.security_utils.AuditTrailMixin.
"""

from contextvars import ContextVar

from django.db import transaction

_actor = ContextVar("audit_actor", default=None)

# What a school admin sees as the "area" of a change, keyed by app_label.model_name.
AREAS = {
    "academic.subjectscore": "Scores",
    "academic.reportcard": "Report cards",
    "academic.student": "Students",
    "bursary.payment": "Payments",
    "bursary.feeitem": "Fees",
}

# Record-level entries (created / deleted) use this in place of a field name.
RECORD = "__record__"

# Values longer than this (e.g. embedded images) are cut; the audit is about who changed what.
MAX_VALUE = 300


def set_actor(user, request=None):
    meta = getattr(request, "META", {}) if request is not None else {}
    forwarded = meta.get("HTTP_X_FORWARDED_FOR", "")
    _actor.set(
        {
            "user": user,
            "ip": (forwarded.split(",")[0].strip() if forwarded else meta.get("REMOTE_ADDR")) or None,
            "ua": (meta.get("HTTP_USER_AGENT") or "")[:500],
        }
    )


def clear_actor():
    _actor.set(None)


def current_actor():
    return _actor.get() or {}


def content_type_of(instance):
    return f"{instance._meta.app_label}.{instance._meta.model_name}"


def record_label(instance):
    """A short, human description of the record, stored with each entry so the log stays readable later."""
    try:
        kind = content_type_of(instance)
        if kind == "academic.student":
            return f"{instance.names} ({instance.student_no or 'no admission no.'})"
        if kind == "academic.reportcard":
            return f"{instance.student.names} · {instance.session} {instance.term}"
        if kind == "academic.subjectscore":
            card = instance.report_card
            return f"{card.student.names} · {instance.subject.name} · {card.session} {card.term}"
        if kind == "bursary.payment":
            return f"{instance.student.names} · ₦{instance.amount:,.2f} · {instance.reference}"
        if kind == "bursary.feeitem":
            return f"{instance.category.name} · {instance.session} {instance.term}"
    except Exception:
        pass  # a related row may already be gone (e.g. during a cascade delete)
    return str(instance)[:255]


def _text(value):
    if value is None:
        return None
    text = str(value)
    return text if len(text) <= MAX_VALUE else text[: MAX_VALUE - 1] + "…"


def log_changes(instance, action, changes):
    """changes: [(field_name, old, new)]. One row per field, written in a single insert."""
    if not changes:
        return
    actor = current_actor()
    school_id = getattr(instance, "school_id", None)
    label = record_label(instance)
    # Own savepoint: if writing the audit row fails, only that is rolled back. The change it
    # describes (a score, a payment) must never fail because of its audit entry.
    with transaction.atomic():
        _write(instance, action, changes, actor, label, school_id)


def _write(instance, action, changes, actor, label, school_id):
    from core.models import FieldChangeLog

    user = actor.get("user")
    FieldChangeLog.objects.bulk_create(
        [
            FieldChangeLog(
                school_id=school_id,
                user=user if getattr(user, "pk", None) else None,
                content_type=content_type_of(instance),
                object_id=str(instance.pk),
                object_label=label[:255],
                action=action,
                field_name=field,
                old_value=_text(old),
                new_value=_text(new),
                ip_address=actor.get("ip"),
                user_agent=actor.get("ua") or None,
            )
            for field, old, new in changes
        ]
    )
