# feat: security audit trails

## Summary
Every system mutation (grades, finances, inventory) is audited at the database level for full accountability.

## Branch Name
`feature/security-audit-trails`

## PR Title
`feat: add database-level audit trails for grades, finance, and inventory mutations`

---

## What to Build

- Generic `AuditLog` model capturing actor, action, target object, before/after snapshot
- Django signal or mixin that auto-logs on save/delete for flagged models
- Admin UI to query audit log by user, model, date range
- No audit records can be edited or deleted (append-only)

## Model

```python
class AuditLog(models.Model):
    ACTIONS = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("bulk_action", "Bulk Action"),
    ]
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=20, choices=ACTIONS)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict)  # {"field": [before, after]}
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["actor", "timestamp"]),
        ]
```

## Audit Mixin

```python
class AuditableMixin:
    """
    Add to any ModelViewSet to auto-log create/update/delete.
    """
    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action="create",
            model_name=instance.__class__.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance),
            ip_address=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        before = model_to_dict(serializer.instance)
        instance = serializer.save()
        after = model_to_dict(instance)
        changes = {k: [before[k], after[k]] for k in after if before.get(k) != after.get(k)}
        AuditLog.objects.create(
            actor=self.request.user,
            action="update",
            model_name=instance.__class__.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance),
            changes=changes,
            ip_address=get_client_ip(self.request),
        )
```

## Audited Models

| Module | Models Audited |
|--------|---------------|
| Grades | `Grade`, `GradingScheme` |
| Finance | `Payment`, `FeeAssignment`, `FeeDiscount` |
| Inventory | `StockMovement`, `InventoryItem` |
| Users | `User` (role changes, password resets) |
| CBT | `ExamSession`, `ExamViolation` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-log/` | Query audit log (admin only) |
| GET | `/api/audit-log/?model=Grade&actor_id=5&from=2026-01-01` | Filtered query |

## Acceptance Criteria
- [ ] AuditLog records created for all create/update/delete on audited models
- [ ] `changes` field captures before/after values for updates
- [ ] Audit records are append-only — no update or delete permissions on the model
- [ ] Admin can filter by actor, model, date range, and action type
- [ ] IP address captured on every log entry
