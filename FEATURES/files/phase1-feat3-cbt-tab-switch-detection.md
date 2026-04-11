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
- [x] Tab switch / window blur triggers a violation event
- [x] Warning overlay shown with remaining attempts
- [x] Violations logged server-side with timestamps
- [x] Exam auto-submits after max violations reached
- [x] Admin/teacher can view violation log per session



Now, follow my implementation files. for each implementation you want to implement, use that file as the entry point. do not create any artifact on .gemini file or folder. example, use `FEATURES/files/phase1-feat3-cbt-tab-switch-detection.md` as you entry point for that implementation and use it to track all of your ahanges. 

DO NOT CREATE ANY ARTIFACT IN THE GEMINI FOLDER OR FILE. FOLLOW THIS STRICT RULE

## Implementation Plan

### 1. Backend Settings & Models
- [x] Add config `CBT_MAX_VIOLATIONS`, `CBT_VIOLATION_WARN`, `CBT_LOCK_ON_EXCEED` to `backend/config/settings.py`.
- [x] Create `ExamViolation` model in `backend/learning/models.py` linking to `Attempt` (the CBT session).
- [x] Make and apply database migrations.

### 2. Backend APIs
- [x] Create `ExamViolationSerializer` in `backend/learning/serializers.py`.
- [x] Add `violations` POST/GET action to `AttemptViewSet` in `backend/learning/views.py`.
- [x] Ensure `auto_submit` triggers automatically if violations reach the threshold.

### 3. Frontend Types & Integration
- [x] Update `lib/types.ts` to include `ExamViolation` type and include violations count on `Attempt`.
- [x] Identify/Create the student CBT-taking UI (`TakeQuizView` or equivalent).
- [x] Implement `visibilitychange` and `blur` event listeners directly in the active test taking component.
- [x] Add a warning overlay UI when a violation occurs or exam auto-submits.

## Testing Guide (Frontend)

To verify the implementation is working correctly, follow these steps:

1. **Role Switch:** Ensure you are logged in as a **Student**. The `TakeQuizView` only renders for students.
2. **Launch Exam:** Navigate to `Dashboard > CBT / Quizzes` and click on any **Published** quiz.
3. **HUD Verification:** You should see a focused exam view with a countdown timer, a progress bar, and a "Complete Exam" button.
4. **Test Tab Switch:**
   - Switch to another browser tab or minimize the window.
   - Switch back to the EduSphere tab.
   - **Expected:** A red warning toast should appear ("Violation 1/3") and the top HUD counter should update.
5. **Auto-Submit Test:**
   - Repeat the tab switch 2 more times.
   - **Expected:** On the 3rd violation, the exam should automatically submit, show a "Submitted" success card, and prevent further answering.
6. **Backend Audit:** Verify the violations log via `/api/learning/attempts/{id}/violations/` or through the Django admin.
