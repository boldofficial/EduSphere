# feat: revenue forecasting dashboard [COMPLETED]

## Summary
A visual dashboard providing predictive fee collection analysis vs. expected revenue.

## Branch Name
`feature/revenue-forecasting-dashboard`

## PR Title
`feat: add revenue forecasting and collection analytics dashboard`

---

## What was Built
- Aggregate expected vs. collected fees per term/month (Backend & Frontend)
- Project end-of-term collection rate based on current pace (Forecasting Logic)
- Visual chart: Expected Revenue vs Actual Collections (Bar + Area + Line)
- Summary cards: Total Expected, Total Collected, Outstanding, Forecast Outcome
- Term selector for historical comparison and active planning

## Acceptance Criteria
- [x] Create `AcademicTerm` model in `academic/models.py` (Updated from `schools/` for modularity)
- [x] Add `revenue_summary` and `revenue_chart` actions to `DashboardViewSet` in `bursary/views.py`
- [x] Implement forecasting logic (collection pace) in the backend with Decimal precision
- [x] Create `app/(dashboard)/bursary/forecasting/page.tsx` with premium glassmorphism
- [x] Integrate collection trend chart using Recharts ComposedChart
- [x] Add filtering by Term and Session via reactive hooks
- [x] Sidebar integration: "Revenue Forecast" link added under "Account"
- [x] Access Control: Linked to existing `bursary` plan permissions
- [x] Migration Sync: Deployment script verified for schema updates

## Implementation Outcome
The forecasting engine now provides a mathematical projection of the term's financial outcome based on the current collection velocity. The UI allows administrators to visualize the gap between target goals and current performance with high-precision metrics.

---
*Implementation finalized by Antigravity AI.*