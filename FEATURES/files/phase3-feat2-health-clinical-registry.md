# feat: health clinical registry (sick-bay module)

## Summary
A dedicated module for tracking sick-bay visits, treatments administered, and parent notifications for medical follow-ups.

## Branch Name
`feature/health-clinical-registry`

## PR Title
`feat: add health clinical registry for sick-bay visit tracking and parent notifications`

---

## What to Build

- Log sick-bay visits with symptoms, treatment, and nurse notes
- Link visits to a student record
- Auto-notify parent on visit creation and discharge
- Follow-up flag for visits requiring further action
- Admin/nurse dashboard showing active cases and history

## Models

```python
class SickBayVisit(models.Model):
    STATUS = [("active", "Active"), ("discharged", "Discharged"), ("referred", "Referred")]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="sickbay_visits")
    arrived_at = models.DateTimeField(auto_now_add=True)
    discharged_at = models.DateTimeField(null=True, blank=True)
    symptoms = models.TextField()
    treatment = models.TextField(blank=True)
    nurse_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="active")
    requires_followup = models.BooleanField(default=False)
    parent_notified = models.BooleanField(default=False)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

class VisitAttachment(models.Model):
    visit = models.ForeignKey(SickBayVisit, related_name="attachments", on_delete=models.CASCADE)
    file = models.FileField(upload_to="sickbay/attachments/")
    label = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

## Parent Notification Signal

```python
@receiver(post_save, sender=SickBayVisit)
def notify_parent_on_visit(sender, instance, created, **kwargs):
    if created and not instance.parent_notified:
        parent = instance.student.guardian
        send_notification(
            recipient=parent,
            title=f"Sick Bay: {instance.student.first_name} has been admitted",
            body=f"Symptoms: {instance.symptoms}. Our nurse is attending to them. You will be updated shortly.",
        )
        instance.parent_notified = True
        instance.save(update_fields=["parent_notified"])

@receiver(post_save, sender=SickBayVisit)
def notify_parent_on_discharge(sender, instance, **kwargs):
    if instance.status == "discharged" and instance.discharged_at:
        parent = instance.student.guardian
        send_notification(
            recipient=parent,
            title=f"{instance.student.first_name} has been discharged from the sick bay",
            body=instance.nurse_notes or "They are feeling better and have returned to class.",
        )
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/visits/` | List visits (filter by status, student, date) |
| POST | `/api/health/visits/` | Log a new sick-bay visit |
| PATCH | `/api/health/visits/:id/` | Update treatment/notes/discharge |
| GET | `/api/health/visits/?requires_followup=true` | Follow-up queue |

## Acceptance Criteria
- [ ] Nurse can log a new visit with symptoms and initial treatment
- [ ] Parent is notified automatically on visit creation
- [ ] Parent is notified on discharge
- [ ] Visits can be marked as requiring follow-up
- [ ] Nurse/admin can view active cases and full history per student
- [ ] File attachments supported (e.g. referral letters)
