"""Audit trail: record-level entries for tracked models (field edits are logged by AuditTrailMixin)."""

import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from core.audit import RECORD, log_changes
from core.security_utils import AuditTrailMixin

logger = logging.getLogger(__name__)

# Creating scores and report cards happens in bulk during score entry; their later edits are what
# matters. Payments and students are created one at a time and their creation is worth seeing.
LOG_CREATE = {"bursary.payment", "academic.student"}
# Scores disappear with their report card; logging each would bury the deletion that caused it.
SKIP_DELETE = {"academic.subjectscore"}


def _kind(instance):
    return f"{instance._meta.app_label}.{instance._meta.model_name}"


@receiver(post_save)
def audit_created(sender, instance, created, raw=False, **kwargs):
    if not created or raw or not isinstance(instance, AuditTrailMixin) or _kind(instance) not in LOG_CREATE:
        return
    try:
        log_changes(instance, "CREATE", [(RECORD, None, None)])
    except Exception:
        logger.exception("Audit trail: could not record creation of %s", sender.__name__)


@receiver(post_delete)
def audit_deleted(sender, instance, **kwargs):
    if not isinstance(instance, AuditTrailMixin) or _kind(instance) in SKIP_DELETE:
        return
    try:
        log_changes(instance, "DELETE", [(RECORD, None, None)])
    except Exception:
        logger.exception("Audit trail: could not record deletion of %s", sender.__name__)
