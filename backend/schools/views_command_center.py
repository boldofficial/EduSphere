"""
Super admin command center: everything the platform owner needs at a glance, in one request.

- kpis: schools, recurring revenue (MRR), revenue this month against last, people on the platform.
- attention: work waiting on the super admin (payments to approve, lapsed or lapsing
  subscriptions, urgent tickets, demo requests, failed emails), most urgent first. Only items that
  need doing are returned, so an empty list means nothing is waiting.
- renewals: subscriptions ending in the next 30 days.
- trends: the last 12 months of new schools and revenue, with empty months filled in.
- plans: schools and MRR per plan.
- recent_schools: the newest sign-ups with their plan, status and size.
- activity: recent business events (sign-ups, activations, payments, plan changes), without the
  per-request audit noise.

Infrastructure health stays on schools/health/ (it pings the workers, which can be slow).
"""

from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsSuperAdmin

from .models import DemoRequest, School, SchoolPayment, Subscription, SubscriptionPlan, SupportTicket

TENANTS = "/dashboard/super-admin/tenants"
SEVERITY_ORDER = {"critical": 0, "warning": 1, "info": 2}


def monthly_value(plan):
    """A plan's price as a 30-day amount, so monthly and yearly plans add up together."""
    if not plan or not plan.price:
        return Decimal("0")
    days = plan.duration_days or 30
    return plan.price * Decimal(30) / Decimal(days)


def month_start(when, back=0):
    first = when.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(back):
        first = (first - timedelta(days=1)).replace(day=1)
    return first


def _money(value):
    return float(round(value or 0, 2))


def _plural(count, word, plural=None):
    return f"{count} {word if count == 1 else (plural or word + 's')}"


def kpis(now):
    this_month, last_month = month_start(now), month_start(now, 1)
    schools = School.objects.aggregate(
        total=Count("id"),
        new_this_month=Count("id", filter=Q(created_at__gte=this_month)),
        new_last_month=Count("id", filter=Q(created_at__gte=last_month, created_at__lt=this_month)),
    )
    active = Subscription.objects.filter(status="active", end_date__gte=now).select_related("plan")
    paid = SchoolPayment.objects.filter(status="success")
    revenue = paid.aggregate(
        this_month=Sum("amount", filter=Q(date__gte=this_month)),
        last_month=Sum("amount", filter=Q(date__gte=last_month, date__lt=this_month)),
        this_year=Sum("amount", filter=Q(date__year=now.year)),
    )

    from academic.models import Student, Teacher

    return {
        "schools": {**schools, "active": active.count()},
        "mrr": _money(sum((monthly_value(s.plan) for s in active), Decimal("0"))),
        "revenue": {key: _money(value) for key, value in revenue.items()},
        "students": Student.objects.filter(status="active").count(),
        "teachers": Teacher.objects.count(),
    }


def attention(now):
    items = []

    def add(key, severity, title, count, summary, href, rows=()):
        if count:
            items.append(
                {
                    "key": key,
                    "severity": severity,
                    "title": title,
                    "count": count,
                    "summary": summary,
                    "href": href,
                    "items": list(rows)[:5],
                }
            )

    awaiting = Subscription.objects.filter(status="pending").select_related("school", "plan").order_by("updated_at")
    add(
        "subscriptions_pending",
        "critical",
        "Subscriptions waiting for approval",
        awaiting.count(),
        "Schools that paid or chose a plan and are waiting for you to activate it.",
        TENANTS,
        ({"label": s.school.name, "detail": f"{s.plan.name} · {s.get_payment_method_display()}"} for s in awaiting[:5]),
    )

    payments = SchoolPayment.objects.filter(status="pending").select_related("school").order_by("date")
    add(
        "payments_pending",
        "critical",
        "Payments to confirm",
        payments.count(),
        "Recorded payments that have not been confirmed yet.",
        "/dashboard/super-admin/financials",
        ({"label": p.school.name, "detail": f"₦{p.amount:,.0f} · {p.reference}"} for p in payments[:5]),
    )

    urgent = (
        SupportTicket.objects.filter(status__in=["open", "in_progress"], priority__in=["urgent", "high"])
        .select_related("school")
        .order_by("created_at")
    )
    add(
        "tickets_urgent",
        "critical",
        "Urgent support tickets",
        urgent.count(),
        "High and urgent tickets that are still open.",
        "/dashboard/super-admin/support",
        ({"label": t.subject, "detail": f"{t.school.name} · {t.get_priority_display()}"} for t in urgent[:5]),
    )

    overdue = Subscription.objects.filter(status="active", end_date__lt=now).select_related("school", "plan")
    add(
        "subscriptions_overdue",
        "warning",
        "Active past their end date",
        overdue.count(),
        "Still marked active although the paid period has ended. Renew or expire them.",
        TENANTS,
        ({"label": s.school.name, "detail": f"Ended {s.end_date:%d %b %Y}"} for s in overdue.order_by("end_date")[:5]),
    )

    soon = Subscription.objects.filter(
        status="active", end_date__gte=now, end_date__lt=now + timedelta(days=14), auto_renew=False
    ).select_related("school")
    add(
        "subscriptions_ending",
        "warning",
        "Ending soon without auto-renew",
        soon.count(),
        "Subscriptions ending in the next 14 days that will not renew on their own.",
        TENANTS,
        ({"label": s.school.name, "detail": f"Ends {s.end_date:%d %b}"} for s in soon.order_by("end_date")[:5]),
    )

    from emails.models import EmailLog

    failed = EmailLog.objects.filter(status="failed", sent_at__gte=now - timedelta(days=7)).order_by("-sent_at")
    add(
        "emails_failed",
        "warning",
        "Emails that failed this week",
        failed.count(),
        "Messages that did not reach the recipient in the last 7 days.",
        "/dashboard/super-admin/logs",
        ({"label": e.recipient, "detail": e.subject or e.error_message[:80]} for e in failed[:5]),
    )

    tickets = SupportTicket.objects.filter(status="open").exclude(priority__in=["urgent", "high"])
    add(
        "tickets_open",
        "info",
        "Open support tickets",
        tickets.count(),
        "Normal and low priority tickets nobody has picked up.",
        "/dashboard/super-admin/support",
        (
            {"label": t.subject, "detail": t.school.name}
            for t in tickets.select_related("school").order_by("created_at")[:5]
        ),
    )

    demos = DemoRequest.objects.filter(status="pending").order_by("created_at")
    add(
        "demos_pending",
        "info",
        "Demo requests to review",
        demos.count(),
        "Prospective schools waiting to hear back.",
        "/dashboard/super-admin/demo-requests",
        ({"label": d.school_name, "detail": f"{d.name} · {d.created_at:%d %b}"} for d in demos[:5]),
    )

    unsubscribed = School.objects.filter(subscription__isnull=True).order_by("-created_at")
    add(
        "schools_without_plan",
        "info",
        "Schools without a plan",
        unsubscribed.count(),
        "Signed up but never chose a plan.",
        TENANTS,
        ({"label": s.name, "detail": f"Joined {s.created_at:%d %b %Y}"} for s in unsubscribed[:5]),
    )

    items.sort(key=lambda item: SEVERITY_ORDER[item["severity"]])
    return items


def renewals(now):
    rows = (
        Subscription.objects.filter(status="active", end_date__gte=now, end_date__lt=now + timedelta(days=30))
        .select_related("school", "plan")
        .order_by("end_date")
    )
    return [
        {
            "school_id": s.school_id,
            "school": s.school.name,
            "plan": s.plan.name,
            "end_date": s.end_date,
            "days_left": (s.end_date - now).days,
            "auto_renew": s.auto_renew,
            "amount": _money(s.plan.price),
        }
        for s in rows[:10]
    ]


def trends(now):
    start = month_start(now, 11)
    schools = dict(
        School.objects.filter(created_at__gte=start)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(count=Count("id"))
        .values_list("month", "count")
    )
    revenue = dict(
        SchoolPayment.objects.filter(status="success", date__gte=start)
        .annotate(month=TruncMonth("date"))
        .values("month")
        .annotate(amount=Sum("amount"))
        .values_list("month", "amount")
    )
    schools = {m.strftime("%Y-%m"): v for m, v in schools.items()}
    revenue = {m.strftime("%Y-%m"): v for m, v in revenue.items()}
    months = []
    for back in range(11, -1, -1):
        first = month_start(now, back)
        key = first.strftime("%Y-%m")
        months.append(
            {
                "month": key,
                "label": first.strftime("%b"),
                "schools": schools.get(key, 0),
                "revenue": _money(revenue.get(key)),
            }
        )
    return months


def plans(now):
    rows = []
    for plan in SubscriptionPlan.objects.annotate(
        active=Count("subscription", filter=Q(subscription__status="active", subscription__end_date__gte=now))
    ).order_by("price"):
        if plan.active or plan.is_active:
            rows.append(
                {
                    "name": plan.name,
                    "schools": plan.active,
                    "mrr": _money(monthly_value(plan) * plan.active),
                }
            )
    return rows


def recent_schools():
    rows = (
        School.objects.select_related("subscription__plan")
        .annotate(students=Count("student_related", filter=Q(student_related__status="active")))
        .order_by("-created_at")[:6]
    )
    result = []
    for school in rows:
        subscription = getattr(school, "subscription", None)
        result.append(
            {
                "id": school.id,
                "name": school.name,
                "domain": school.domain,
                "created_at": school.created_at,
                "plan": subscription.plan.name if subscription else None,
                "status": subscription.status if subscription else "no_plan",
                "students": school.students,
            }
        )
    return result


# Logged for every write and every refused request; too noisy for the owner's feed.
REQUEST_NOISE = ("RECORDS_MUTATED", "ACCESS_DENIED")


def activity():
    from core.models import GlobalActivityLog

    logs = GlobalActivityLog.objects.exclude(action__in=REQUEST_NOISE).select_related("school")[:8]
    return [
        {
            "id": log.id,
            "action": log.action,
            "description": log.description,
            "school_name": log.school.name if log.school else "Platform",
            "created_at": log.created_at,
        }
        for log in logs
    ]


class CommandCenterView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        return Response(
            {
                "generated_at": now,
                "kpis": kpis(now),
                "attention": attention(now),
                "renewals": renewals(now),
                "trends": trends(now),
                "plans": plans(now),
                "recent_schools": recent_schools(),
                "activity": activity(),
            }
        )
