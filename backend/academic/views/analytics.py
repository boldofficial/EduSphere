"""
School analytics summary — aggregates computed in the database so the Analytics page does not have
to download every score, payment, expense and attendance record.
"""

from django.db.models import Avg, Count, Q, Sum
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from bursary.models import Expense, Payment
from core.tenant_utils import get_request_school
from schools.models import SchoolSettings

from ..models import AttendanceRecord, AttendanceSession, Class, ReportCard, Student

DEFAULT_TERMS = ["First Term", "Second Term", "Third Term"]
EXPENSE_CATEGORIES = ["salary", "maintenance", "supplies", "utilities", "other"]


class IsSchoolManagement(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in ("SUPER_ADMIN", "SCHOOL_ADMIN", "STAFF"))
        )


def _short(term):
    return term.replace(" Term", "")


def _num(value):
    return float(value or 0)


class SchoolAnalyticsView(APIView):
    """GET /api/academic/analytics/?session=2025/2026"""

    permission_classes = [permissions.IsAuthenticated, IsSchoolManagement]

    def get(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        settings = SchoolSettings.objects.filter(school=school).first()
        session = request.query_params.get("session") or getattr(settings, "current_session", "")
        current_term = getattr(settings, "current_term", "") or DEFAULT_TERMS[0]
        raw_terms = (getattr(settings, "terms_list", None) or DEFAULT_TERMS) if settings else DEFAULT_TERMS
        terms = [t.get("name", "") if isinstance(t, dict) else str(t) for t in raw_terms] or DEFAULT_TERMS

        reports = ReportCard.objects.filter(school=school, session=session)
        payments = Payment.objects.filter(school=school, session=session, status="completed")
        expenses = Expense.objects.filter(school=school, session=session)
        attendance = AttendanceRecord.objects.filter(school=school, attendance_session__session=session)

        perf = {
            row["term"]: row
            for row in reports.filter(average__gt=0).values("term").annotate(avg=Avg("average"), scored=Count("id"))
        }
        revenue = {row["term"]: row["total"] for row in payments.values("term").annotate(total=Sum("amount"))}
        spent = {row["term"]: row["total"] for row in expenses.values("term").annotate(total=Sum("amount"))}
        att = {
            row["attendance_session__term"]: row
            for row in attendance.values("attendance_session__term").annotate(
                total=Count("id"), present=Count("id", filter=Q(status="present"))
            )
        }
        days = {
            row["term"]: row["days"]
            for row in AttendanceSession.objects.filter(school=school, session=session)
            .values("term")
            .annotate(days=Count("id"))
        }

        performance, financial, attendance_rates = [], [], []
        for term in terms:
            p = perf.get(term)
            performance.append(
                {
                    "term": _short(term),
                    "average": round(_num(p["avg"]) if p else 0, 1),
                    "studentsScored": p["scored"] if p else 0,
                }
            )
            rev, exp = _num(revenue.get(term)), _num(spent.get(term))
            financial.append({"term": _short(term), "revenue": rev, "expenses": exp, "profit": rev - exp})
            a = att.get(term)
            rate = (a["present"] / a["total"] * 100) if a and a["total"] else 0
            attendance_rates.append(
                {"term": _short(term), "attendanceRate": round(rate, 1), "daysRecorded": days.get(term, 0)}
            )

        class_comparison = []
        classes = (
            Class.objects.filter(school=school)
            .annotate(
                student_count=Count("students", distinct=True),
                avg=Avg(
                    "students__report_cards__average",
                    filter=Q(
                        students__report_cards__session=session,
                        students__report_cards__term=current_term,
                        students__report_cards__average__gt=0,
                    ),
                ),
            )
            .filter(student_count__gt=0)
            .order_by("name")
        )
        for cls in classes:
            class_comparison.append(
                {"class": cls.name, "average": round(_num(cls.avg), 1), "students": cls.student_count}
            )

        by_category = dict(expenses.values_list("category").annotate(total=Sum("amount")))
        expense_breakdown = [
            {"name": cat.capitalize(), "value": _num(by_category.get(cat))}
            for cat in EXPENSE_CATEGORIES
            if _num(by_category.get(cat)) > 0
        ]

        return Response(
            {
                "session": session,
                "total_students": Student.objects.filter(school=school).count(),
                "performance": performance,
                "class_comparison": class_comparison,
                "financial": financial,
                "expense_breakdown": expense_breakdown,
                "attendance": attendance_rates,
            }
        )
