# feat: automated arrears fee reminders

## Summary
Automated system for sending fee reminder notifications to parents of students with outstanding balances.

## Branch Name
`feature/arrears-reminders`

## PR Title
`feat: add automated arrears reminder notifications for outstanding fees`

---

## What to Build

- Scheduled task that identifies students with outstanding balances past a due date
- Sends reminder via SMS and/or in-app notification to parent/guardian
- Configurable reminder schedule (e.g. 7 days, 3 days, due date, 3 days overdue)
- Reminder log to prevent duplicate sends

## Model

```python
class ArrearReminder(models.Model):
    STATUS = [("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed")]
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    fee_assignment = models.ForeignKey(FeeAssignment, on_delete=models.CASCADE)
    days_offset = models.IntegerField(help_text="Negative = before due, positive = after due")
    channel = models.CharField(max_length=20, choices=[("sms", "SMS"), ("push", "Push"), ("email", "Email")])
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    sent_at = models.DateTimeField(null=True, blank=True)
    message_preview = models.TextField(blank=True)
```

## Celery Task

```python
@shared_task
def send_arrear_reminders():
    today = timezone.now().date()
    checkpoints = [-7, -3, 0, 3, 7]  # days relative to due date

    for offset in checkpoints:
        target_due = today - timedelta(days=offset)
        assignments = FeeAssignment.objects.filter(
            due_date=target_due,
            is_active=True
        ).exclude(
            arrearreminder__days_offset=offset,
            arrearreminder__status="sent"
        )
        for assignment in assignments:
            outstanding_students = get_outstanding_students(assignment)
            for student in outstanding_students:
                dispatch_reminder(student, assignment, offset)
```

## Message Template

```
Dear {parent_name},
This is a reminder that {student_name}'s {fee_name} of {currency}{amount_due}
is {due_status}. Please log in to myregistra to complete payment.
Thank you.
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/reminders/?term_id=` | List all reminders sent this term |
| POST | `/api/finance/reminders/trigger/` | Manually trigger reminders (admin) |
| GET | `/api/finance/reminders/log/?student_id=` | Reminder history for a student |

## Acceptance Criteria
- [ ] Celery beat runs reminder task daily
- [ ] Reminders sent at configured day offsets relative to due date
- [ ] Duplicate sends prevented via reminder log
- [ ] Admin can manually trigger reminders for a specific class or student
- [ ] Parent receives message with outstanding amount and due status
