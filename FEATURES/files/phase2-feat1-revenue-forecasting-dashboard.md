# feat: revenue forecasting dashboard

## Summary
A visual dashboard providing predictive fee collection analysis vs. expected revenue.

## Branch Name
`feature/revenue-forecasting-dashboard`

## PR Title
`feat: add revenue forecasting and collection analytics dashboard`

---

## What to Build

- Aggregate expected vs. collected fees per term/month
- Project end-of-term collection rate based on current pace
- Visual chart: Expected Revenue vs Actual Collections (bar + trend line)
- Summary cards: Total Expected, Total Collected, Outstanding, Forecast %

## Core Query

```python
from django.db.models import Sum
from django.utils import timezone

def get_revenue_summary(term):
    expected = FeeAssignment.objects.filter(term=term).aggregate(total=Sum("amount"))["total"] or 0
    collected = Payment.objects.filter(term=term, status="confirmed").aggregate(total=Sum("amount"))["total"] or 0
    outstanding = expected - collected
    days_elapsed = (timezone.now().date() - term.start_date).days
    days_total = (term.end_date - term.start_date).days
    forecast = (collected / days_elapsed * days_total) if days_elapsed > 0 else 0
    return {
        "expected": expected,
        "collected": collected,
        "outstanding": outstanding,
        "forecast": round(forecast, 2),
        "collection_rate": round((collected / expected * 100), 1) if expected else 0,
    }
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/revenue-summary/?term_id=` | Summary cards data |
| GET | `/api/finance/revenue-chart/?term_id=&group_by=week` | Chart data (weekly/monthly) |

## Chart Data Shape

```json
{
  "labels": ["Week 1", "Week 2", "Week 3"],
  "expected": [500000, 500000, 500000],
  "collected": [320000, 410000, 450000],
  "forecast": [533000, 546000, 558000]
}
```

## Acceptance Criteria
- [ ] Dashboard shows Expected, Collected, Outstanding, Forecast as summary cards
- [ ] Bar chart renders expected vs collected per week/month
- [ ] Forecast trend line projected to end of term
- [ ] Filterable by term and class group
- [ ] Data refreshes without full page reload
