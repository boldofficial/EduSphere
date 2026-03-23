# feat: executive dashboard — unified admin view

## Summary
A premium "Unified View" for administrators with high-level academic and financial health indicators on a single screen.

## Branch Name
`feature/executive-dashboard`

## PR Title
`feat: add executive dashboard with unified academic and financial health indicators`

---

## What to Build

- Single-page overview restricted to admin/principal role
- Academic panel: attendance rate, average grades, CBT completion, flagged students
- Financial panel: collection rate, outstanding arrears, top defaulters, forecast
- Activity feed: recent system events (payments, grade submissions, sick-bay admits)
- All data fetched from optimized aggregate queries (no N+1)

## Backend — Aggregate Service

```python
def get_executive_summary(school, term):
    students = Student.objects.filter(school=school, is_active=True)
    total = students.count()

    # Academic
    attendance_rate = AttendanceRecord.objects.filter(
        student__in=students, term=term
    ).aggregate(
        rate=Avg(Case(When(status="present", then=1.0), default=0.0))
    )["rate"] or 0

    avg_grade = Grade.objects.filter(
        student__in=students, term=term
    ).aggregate(avg=Avg("score"))["avg"] or 0

    # Financial
    expected = FeeAssignment.objects.filter(term=term).aggregate(t=Sum("amount"))["t"] or 0
    collected = Payment.objects.filter(term=term, status="confirmed").aggregate(t=Sum("amount"))["t"] or 0
    collection_rate = round((collected / expected * 100), 1) if expected else 0

    return {
        "total_students": total,
        "attendance_rate": round(attendance_rate * 100, 1),
        "avg_grade": round(avg_grade, 1),
        "collection_rate": collection_rate,
        "outstanding": expected - collected,
        "collected": collected,
        "expected": expected,
    }
```

## Dashboard Panels

| Panel | Metrics |
|-------|---------|
| Academic Health | Attendance %, Average Grade, CBT Completion %, Students Flagged |
| Financial Health | Collection Rate %, Total Collected, Outstanding, Forecast |
| Welfare | Active Sick-Bay Cases, Absence Alerts Today, Follow-ups Pending |
| Activity Feed | Last 20 system events across all modules |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/executive/?term_id=` | Full summary payload |
| GET | `/api/dashboard/activity-feed/` | Recent system activity |

## Access Control

```python
class ExecutiveDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrPrincipal]
```

## Acceptance Criteria
- [ ] Dashboard accessible only to admin and principal roles
- [ ] All four panels render with live data
- [ ] Page load under 1 second using aggregate queries (no per-student loops)
- [ ] Term selector allows switching between current and past terms
- [ ] Activity feed shows last 20 events, newest first
