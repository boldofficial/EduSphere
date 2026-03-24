# feat: CBT exam security — tab-switch detection

## Summary
Browser tab-switch detection to flag or auto-submit exams when a student navigates away, ensuring exam integrity.

## Branch Name
`feature/cbt-tab-switch-detection`

## PR Title
`feat: add tab-switch detection and exam integrity enforcement to CBT module`

---

## What to Build

- Detect `visibilitychange` and `blur` events during an active CBT session
- Log each violation with a timestamp server-side
- After N violations (configurable), auto-submit or lock the exam
- Show a visible warning overlay to the student on each infraction

## Frontend (JS)

```javascript
const MAX_VIOLATIONS = 3;
let violations = 0;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) handleViolation();
});

window.addEventListener("blur", () => handleViolation());

function handleViolation() {
  violations++;
  reportViolation(violations);
  showWarningOverlay(violations, MAX_VIOLATIONS);
  if (violations >= MAX_VIOLATIONS) {
    autoSubmitExam();
  }
}

async function reportViolation(count) {
  await fetch(`/api/cbt/sessions/${SESSION_ID}/violations/`, {
    method: "POST",
    body: JSON.stringify({ count, timestamp: new Date().toISOString() }),
    headers: { "Content-Type": "application/json" }
  });
}
```

## Model

```python
class ExamViolation(models.Model):
    session = models.ForeignKey(CBTSession, related_name="violations", on_delete=models.CASCADE)
    count = models.PositiveIntegerField()
    timestamp = models.DateTimeField()
    auto_submitted = models.BooleanField(default=False)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cbt/sessions/:id/violations/` | Log a tab-switch violation |
| GET | `/api/cbt/sessions/:id/violations/` | Fetch violation log (admin/teacher) |

## Configuration

```python
# settings.py
CBT_MAX_VIOLATIONS = 3          # auto-submit threshold
CBT_VIOLATION_WARN = True       # show warning overlay
CBT_LOCK_ON_EXCEED = False      # lock vs auto-submit
```

## Acceptance Criteria
- [ ] Tab switch / window blur triggers a violation event
- [ ] Warning overlay shown with remaining attempts
- [ ] Violations logged server-side with timestamps
- [ ] Exam auto-submits after max violations reached
- [ ] Admin/teacher can view violation log per session
