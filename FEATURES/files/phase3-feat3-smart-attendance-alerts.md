# feat: smart attendance alerts — instant parent notification on absence

## Summary
When a student is marked absent, an automated message is instantly sent to their parent/guardian.

## Branch Name
`feature/smart-attendance-alerts`

## PR Title
`feat: add instant parent notification when student is marked absent`

---

## What to Build

- Hook into the attendance marking flow (post-save signal or service layer)
- On `status = "absent"`, dispatch notification to parent immediately
- Support SMS and push notification channels
- Prevent duplicate alerts for the same student/date
- Allow parent to acknowledge the absence via a simple reply or in-app action

## Signal

```python
@receiver(post_save, sender=AttendanceRecord)
def alert_parent_on_absence(sender, instance, created, **kwargs):
    if instance.status != "absent":
        return

    # Prevent duplicate alerts
    already_sent = AbsenceAlert.objects.filter(
        student=instance.student,
        date=instance.date
    ).exists()
    if already_sent:
        return

    parent = instance.student.guardian
    message = (
        f"Dear {parent.first_name}, {instance.student.first_name} "
        f"was marked absent on {instance.date.strftime('%A, %d %B %Y')}. "
        f"Please contact the school if this is unexpected."
    )

    send_notification(recipient=parent, title="Attendance Alert", body=message)

    AbsenceAlert.objects.create(
        student=instance.student,
        date=instance.date,
        channel="push",
        message=message
    )
```

## Models

```python
class AbsenceAlert(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="absence_alerts")
    date = models.DateField()
    channel = models.CharField(max_length=20, choices=[("sms", "SMS"), ("push", "Push")])
    message = models.TextField()
    acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "date")
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/alerts/?date=` | List absence alerts for a date |
| PATCH | `/api/attendance/alerts/:id/acknowledge/` | Parent acknowledges alert |
| GET | `/api/attendance/alerts/?student_id=` | Alert history for a student |

## Acceptance Criteria
- [ ] Parent receives notification within seconds of absence being marked
- [ ] Duplicate alerts blocked — one per student per day
- [ ] Alert includes student name, date, and school contact prompt
- [ ] Parent can acknowledge the alert in-app
- [ ] Teachers and admin can view sent alert log
- [ ] Late arrivals that update status away from "absent" do not re-trigger an alert
