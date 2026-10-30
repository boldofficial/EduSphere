"""
Closed terms are read-only for teachers: scores, report cards and attendance of a term the school has
closed can only be changed by an admin (and the audit trail records who did it).
"""

from rest_framework.exceptions import PermissionDenied

from core.permissions import ADMIN, role_of

from ..calendar import is_closed


def check_term_open(request, school, session, term):
    if role_of(request.user) in ADMIN or request.user.is_superuser:
        return
    if school is not None and is_closed(school, session, term):
        raise PermissionDenied(f"{term} {session} has been closed. Ask an admin to make changes.")


class ClosedTermLockMixin:
    """
    For viewsets whose records carry a session and term (directly or through `term_source`, e.g.
    "report_card" or "attendance_session").
    """

    term_source = None

    def _period(self, data=None, instance=None):
        source = None
        if data is not None:
            source = data.get(self.term_source) if self.term_source else data
        if source is None and instance is not None:
            source = getattr(instance, self.term_source) if self.term_source else instance
        if source is None:
            return None, None
        if isinstance(source, dict):
            return source.get("session"), source.get("term")
        return getattr(source, "session", None), getattr(source, "term", None)

    def _guard(self, school, data=None, instance=None):
        session, term = self._period(data, instance)
        check_term_open(self.request, school, session, term)

    def perform_create(self, serializer):
        self._guard(self._school(), serializer.validated_data)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        # The record's current term and, if it is being moved, the new one.
        self._guard(serializer.instance.school, instance=serializer.instance)
        self._guard(serializer.instance.school, serializer.validated_data, serializer.instance)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        self._guard(instance.school, instance=instance)
        super().perform_destroy(instance)

    def _school(self):
        from core.tenant_utils import get_request_school

        return get_request_school(self.request, allow_super_admin_tenant=True)
