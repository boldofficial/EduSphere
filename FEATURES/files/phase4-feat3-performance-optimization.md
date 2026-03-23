# feat: dashboard performance optimization — query tuning and indices

## Summary
Accelerate dashboard load times with optimized database indices and query refactoring for real-time reporting.

## Branch Name
`feature/dashboard-performance-optimization`

## PR Title
`perf: add optimized indices and query improvements for real-time dashboard reporting`

---

## What to Build

- Add targeted DB indices on high-query fields across core models
- Replace N+1 queries in dashboard views with aggregates and `select_related` / `prefetch_related`
- Add query-level caching for expensive aggregates (Redis, short TTL)
- Django migration to create the new indices

## Migration — New Indices

```python
class Migration(migrations.Migration):
    operations = [
        migrations.AddIndex(
            model_name="attendancerecord",
            index=models.Index(fields=["student", "date", "status"], name="att_student_date_status_idx"),
        ),
        migrations.AddIndex(
            model_name="grade",
            index=models.Index(fields=["student", "term", "subject"], name="grade_student_term_subj_idx"),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["term", "status", "created_at"], name="payment_term_status_idx"),
        ),
        migrations.AddIndex(
            model_name="feeassignment",
            index=models.Index(fields=["term", "school_class"], name="fee_term_class_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["model_name", "object_id"], name="audit_model_obj_idx"),
        ),
    ]
```

## Query Patterns to Fix

```python
# ❌ BEFORE — N+1: fetches student then loops
for student in students:
    grade = Grade.objects.filter(student=student, term=term).last()

# ✅ AFTER — single aggregate query
grades = Grade.objects.filter(
    student__in=students, term=term
).values("student_id").annotate(avg=Avg("score"))

# ❌ BEFORE — repeated DB hit per request
def get_collection_rate(term):
    return Payment.objects.filter(term=term).aggregate(...)

# ✅ AFTER — cached for 60 seconds
@cache_for(60)
def get_collection_rate(term_id):
    return Payment.objects.filter(term_id=term_id).aggregate(...)
```

## Cache Helper

```python
from django.core.cache import cache
import functools

def cache_for(seconds):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            key = f"{fn.__name__}:{args}:{kwargs}"
            result = cache.get(key)
            if result is None:
                result = fn(*args, **kwargs)
                cache.set(key, result, timeout=seconds)
            return result
        return wrapper
    return decorator
```

## Target Benchmarks

| View | Before | Target |
|------|--------|--------|
| Executive Dashboard | ~1800ms | < 400ms |
| Fee Collection Summary | ~900ms | < 200ms |
| Attendance Report | ~1200ms | < 300ms |
| Grade Analytics | ~1500ms | < 350ms |

## Acceptance Criteria
- [ ] Migration applies cleanly with no downtime
- [ ] Django Debug Toolbar (dev) shows no N+1 queries on dashboard views
- [ ] Executive dashboard loads in under 400ms on production hardware
- [ ] Redis cache invalidated correctly on data mutation
- [ ] All new indices confirmed in `EXPLAIN ANALYZE` output
