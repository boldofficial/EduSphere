"""
School admin dashboard summary: every number computed in the database in one request, instead of
the dashboard downloading (and truncating) whole student, payment and expense lists.
"""

from django.db.models import Count, F, Q, Sum
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from admissions.models import Admission
from bursary.models import Expense, Payment
from bursary.views import calculate_expected_revenue
from core.permissions import FINANCE, role_of
from core.tenant_utils import get_request_school
from inventory.models import InventoryItem
from schools.models import SchoolSettings

from ..models import AttendanceRecord, Class, SchoolEvent, Student, Teacher

RECENT_LIMIT = 5


class IsSchoolManagement(permissions.BasePermission):
    def has_permission(self, request, view):
        return role_of(request.user) in FINANCE


def _money(value):
    return float(value or 0)


class AdminDashboardView(APIView):
    """GET /api/academic/dashboard/ — the admin "today" view for the current session and term."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolManagement]

    def get(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        settings = SchoolSettings.objects.filter(school=school).only("current_session", "current_term").first()
        session = getattr(settings, "current_session", "") or ""
        term = getattr(settings, "current_term", "") or ""
        today = timezone.localdate()

        staff_counts = Teacher.objects.filter(school=school).aggregate(
            academic=Count("id", filter=Q(staff_type="ACADEMIC")),
            non_academic=Count("id", filter=Q(staff_type="NON_ACADEMIC")),
        )

        term_payments = Payment.objects.filter(school=school, session=session, term=term)
        collected = term_payments.filter(status="completed").aggregate(total=Sum("amount"))["total"]
        spent = Expense.objects.filter(school=school, session=session, term=term).aggregate(total=Sum("amount"))[
            "total"
        ]
        expected = calculate_expected_revenue(school, session=session, term=term)
        outstanding = max(_money(expected) - _money(collected), 0)

        attendance = AttendanceRecord.objects.filter(school=school, attendance_session__date=today).aggregate(
            total=Count("id"), present=Count("id", filter=Q(status__in=["present", "late"]))
        )
        classes_marked = (
            AttendanceRecord.objects.filter(school=school, attendance_session__date=today)
            .values("attendance_session__student_class")
            .distinct()
            .count()
        )

        recent_payments = [
            {
                "id": p.id,
                "student_name": p.student.names if p.student else "",
                "amount": _money(p.amount),
                "date": p.date,
                "method": p.method,
                "status": p.status,
            }
            for p in term_payments.select_related("student").order_by("-date", "-created_at")[:RECENT_LIMIT]
        ]
        upcoming_events = list(
            SchoolEvent.objects.filter(school=school, start_date__date__gte=today)
            .order_by("start_date")
            .values("id", "title", "start_date", "event_type")[:RECENT_LIMIT]
        )

        return Response(
            {
                "session": session,
                "term": term,
                "counts": {
                    "students": Student.objects.filter(school=school).count(),
                    "teachers": staff_counts["academic"],
                    "staff": staff_counts["non_academic"],
                    "classes": Class.objects.filter(school=school).count(),
                },
                "finance": {
                    "expected": _money(expected),
                    "collected": _money(collected),
                    "outstanding": outstanding,
                    "expenses": _money(spent),
                    "collection_rate": (
                        round(_money(collected) / _money(expected) * 100, 1) if _money(expected) else None
                    ),
                },
                "attendance_today": {
                    "records": attendance["total"],
                    "present": attendance["present"],
                    "rate": (
                        round(attendance["present"] / attendance["total"] * 100, 1) if attendance["total"] else None
                    ),
                    "classes_marked": classes_marked,
                },
                "action_items": {
                    "pending_admissions": Admission.objects.filter(school=school, status="pending").count(),
                    "payments_to_verify": term_payments.filter(status="pending").count(),
                    "low_stock_items": InventoryItem.objects.filter(
                        school=school, quantity_in_stock__lte=F("reorder_level")
                    ).count(),
                },
                "recent_payments": recent_payments,
                "upcoming_events": upcoming_events,
            }
        )
