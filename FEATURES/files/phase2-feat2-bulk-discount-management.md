# feat: bulk discount and fee waiver management

## Summary
Admins can apply fee waivers or scholarships to entire classes or student groups in a single action.

## Branch Name
`feature/bulk-discount-management`

## PR Title
`feat: add bulk fee waiver and scholarship application to bursary module`

---

## What to Build

- UI to select target scope: individual student, class, or custom group
- Discount types: percentage off, fixed amount, full waiver, scholarship tag
- Preview affected students + total impact before confirming
- Audit log entry created on every bulk action

## Model

```python
class FeeDiscount(models.Model):
    DISCOUNT_TYPES = [
        ("percent", "Percentage"),
        ("fixed", "Fixed Amount"),
        ("full_waiver", "Full Waiver"),
        ("scholarship", "Scholarship"),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="discounts")
    fee_assignment = models.ForeignKey(FeeAssignment, on_delete=models.CASCADE)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reason = models.TextField(blank=True)
    applied_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)
```

## Bulk Apply Service

```python
def apply_bulk_discount(scope, fee_assignment_id, discount_type, value, reason, applied_by):
    """
    scope: { "type": "class" | "group" | "student", "ids": [...] }
    """
    students = resolve_scope(scope)
    discounts = [
        FeeDiscount(
            student=s,
            fee_assignment_id=fee_assignment_id,
            discount_type=discount_type,
            value=value,
            reason=reason,
            applied_by=applied_by,
        )
        for s in students
    ]
    FeeDiscount.objects.bulk_create(discounts)
    AuditLog.objects.create(
        action="bulk_discount_applied",
        actor=applied_by,
        meta={"count": len(discounts), "type": discount_type, "value": str(value)}
    )
    return len(discounts)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/finance/discounts/bulk/` | Apply bulk discount |
| GET | `/api/finance/discounts/preview/` | Preview affected students + total impact |
| GET | `/api/finance/discounts/?student_id=` | List discounts for a student |

## Progress Tracking

- [x] Implement `FeeDiscount` model in `backend/bursary/models.py`
- [x] Implement `apply_bulk_discount` service in `backend/bursary/services.py`
- [x] Implement `preview_bulk_discount` logic
- [x] Create API endpoints in `backend/bursary/views.py` (`DiscountViewSet`)
- [x] Register API routes in `backend/bursary/urls.py`
- [x] Add Audit logging for bulk actions
- [x] Implement Frontend UI (Scope selection, Preview modal, Apply action)

## Acceptance Criteria
- [x] Admin can select class or custom group as target scope
- [x] Preview step shows list of affected students and net discount impact
- [x] Bulk create applies discount to all students in scope atomically (Backend done)
- [x] Audit log records who applied the discount, when, and to how many students (Backend done)

Now, follow my implementation files. for each implementation you want to implement, use that file as the entry point. do not create any artifact on .gemini file or folder. example, use `FEATURES/files/phase2-feat2-bulk-discount-management.md` as you entry point for that implementation and use it to track all of your ahanges. 

DO NOT CREATE ANY ARTIFACT IN THE GEMINI FOLDER OR FILE. FOLLOW THIS STRICT RULE
