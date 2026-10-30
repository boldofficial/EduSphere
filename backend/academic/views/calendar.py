"""Academic calendar: sessions, their terms and dates, and which term is current."""

from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import ADMIN, role_of
from core.tenant_utils import get_request_school

from ..calendar import (
    CalendarError,
    create_session,
    describe,
    ensure_calendar,
    school_days,
    session_bounds,
    start_term,
    sync_settings,
    validate_dates,
)
from ..models import AcademicSession, AcademicTerm


class TermSerializer(serializers.ModelSerializer):
    school_days = serializers.SerializerMethodField()

    class Meta:
        model = AcademicTerm
        fields = [
            "id",
            "name",
            "order",
            "start_date",
            "end_date",
            "mid_term_start",
            "mid_term_end",
            "status",
            "closed_at",
            "school_days",
        ]

    def get_school_days(self, obj):
        return school_days(obj)


def session_payload(session):
    start, end = session_bounds(session)
    terms = sorted(session.terms.all(), key=lambda t: t.order)
    return {
        "id": session.id,
        "name": session.name,
        "start_date": start,
        "end_date": end,
        "terms": TermSerializer(terms, many=True).data,
        "status": (
            "active"
            if any(t.status == "active" for t in terms)
            else "closed" if terms and all(t.status == "closed" for t in terms) else "upcoming"
        ),
    }


def _admin(request):
    if role_of(request.user) not in ADMIN:
        return Response({"detail": "Only admins can change the academic calendar."}, status=403)
    return None


class AcademicCalendarView(APIView):
    """
    GET: the current term (week, school days) and every session with its terms.
    POST {"name"?}: add a session; its term dates are copied from the latest session a year on.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = get_request_school(request, allow_super_admin_tenant=True)
        if not school:
            return Response({"current": None, "sessions": []})
        ensure_calendar(school)
        sessions = AcademicSession.objects.filter(school=school).prefetch_related("terms").order_by("-name")
        active = next((t for s in sessions for t in s.terms.all() if t.status == "active"), None)
        if active:
            active.school = school
        return Response({"current": describe(active), "sessions": [session_payload(s) for s in sessions]})

    def post(self, request):
        if denied := _admin(request):
            return denied
        school = get_request_school(request, allow_super_admin_tenant=True)
        try:
            session = create_session(school, request.data.get("name") or None)
        except CalendarError as error:
            return Response({"detail": str(error)}, status=400)
        return Response(session_payload(session), status=201)


class AcademicSessionDetailView(APIView):
    """DELETE a session that has never been used (all its terms still upcoming)."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if denied := _admin(request):
            return denied
        school = get_request_school(request, allow_super_admin_tenant=True)
        session = AcademicSession.objects.filter(school=school, pk=pk).first()
        if not session:
            return Response({"detail": "Session not found."}, status=404)
        if session.terms.exclude(status="upcoming").exists():
            return Response({"detail": "This session has started; it can't be removed."}, status=400)
        session.delete()
        sync_settings(school)
        return Response(status=204)


class AcademicTermDetailView(APIView):
    """PATCH a term's dates: start, end and mid-term break."""

    permission_classes = [permissions.IsAuthenticated]
    DATE_FIELDS = ("start_date", "end_date", "mid_term_start", "mid_term_end")

    def patch(self, request, pk):
        if denied := _admin(request):
            return denied
        school = get_request_school(request, allow_super_admin_tenant=True)
        term = AcademicTerm.objects.select_related("academic_session").filter(school=school, pk=pk).first()
        if not term:
            return Response({"detail": "Term not found."}, status=404)
        field = serializers.DateField(allow_null=True)
        values = {}
        for name in self.DATE_FIELDS:
            if name in request.data:
                raw = request.data[name]
                try:
                    values[name] = field.to_internal_value(raw) if raw not in (None, "") else None
                except serializers.ValidationError:
                    return Response({"detail": f"{name.replace('_', ' ').capitalize()} is not a date."}, status=400)
        try:
            merged = validate_dates(term, values)
        except CalendarError as error:
            return Response({"detail": str(error)}, status=400)
        for name, value in merged.items():
            setattr(term, name, value)
        term.save()
        sync_settings(school)
        return Response(TermSerializer(term).data)


class StartTermView(APIView):
    """POST: make this the current term. The current one is closed."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if denied := _admin(request):
            return denied
        school = get_request_school(request, allow_super_admin_tenant=True)
        term = AcademicTerm.objects.select_related("academic_session").filter(school=school, pk=pk).first()
        if not term:
            return Response({"detail": "Term not found."}, status=404)
        if term.status == "closed":
            return Response({"detail": "This term has been closed."}, status=400)
        start_term(term, request.user)
        return Response(describe(term))


class TermChecklistView(APIView):
    """GET: what is still missing before this term is closed (scores, report cards, attendance, fees)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        from ..term_close import checklist

        if denied := _admin(request):
            return denied
        school = get_request_school(request, allow_super_admin_tenant=True)
        term = AcademicTerm.objects.select_related("academic_session").filter(school=school, pk=pk).first()
        if not term:
            return Response({"detail": "Term not found."}, status=404)
        return Response(checklist(term))
