# feat: threaded LMS discussions

## Summary
Students and teachers can engage in context-aware discussions directly within study materials and assignments.

## Branch Name
`feature/threaded-lms-discussions`

## PR Title
`feat: add threaded discussions to LMS study materials and assignments`

---

## What to Build

- Thread model attached to a `content_object` (generic FK to Assignment or StudyMaterial)
- Nested reply support (parent → child comments)
- UI: collapsible thread panel rendered inline below each material/assignment
- Real-time or polling-based refresh for new replies

## Models

```python
class DiscussionThread(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    created_at = models.DateTimeField(auto_now_add=True)

class DiscussionMessage(models.Model):
    thread = models.ForeignKey(DiscussionThread, related_name="messages", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parent = models.ForeignKey("self", null=True, blank=True, related_name="replies", on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/threads/?content_type=&object_id=` | Fetch thread for a resource |
| POST | `/api/threads/messages/` | Post a new message or reply |
| DELETE | `/api/threads/messages/:id/` | Delete own message |

## Acceptance Criteria
- [x] Thread loads inline below assignment/study material
- [x] Users can post top-level comments
- [x] Users can reply to any comment (recursive nesting supported)
- [x] Authors can Edit and Delete their own messages
- [x] Thread is scoped — each material/assignment has its own thread



==========================

## Status Tracker [x]

### Environment & Tools
- [x] Configure `package.json` with correct `.venv` path and port 8000
- [x] Migrate `requirements.txt` to `pyproject.toml` for `uv` workspace
- [x] Add missing `drf-spectacular-sidecar` to dependencies
- [x] Delete legacy `requirements.txt`
- [x] Verify backend connectivity

### Backend Implementation
- [x] Create `DiscussionThread` and `DiscussionMessage` models in `lms/models.py`
- [x] Create serializers in `lms/serializers.py`
- [x] Create API ViewSets in `lms/views.py`
- [x] Register new models in Django Admin
- [x] Fix missing default in `StudentHistory` to resolve migration error
- [x] Run migrations and verify ContentType IDs (Lesson: 25, Assignment: 43)
- [x] Correct multi-tenancy filter to use `request.tenant`
- [x] Enforce author-only permissions for `update` and `delete`

### Frontend Implementation
- [x] Create `DiscussionThread.tsx` component
- [x] Create `DiscussionMessage.tsx` recursive component (with Edit/Delete/Reply)
- [x] Integrate into `Assignment` detail page (`AssignmentDetailView.tsx`)
- [x] Integrate into `StudyMaterial` detail page (`LearningCenterView.tsx`)
- [x] Activate "Lessons & Materials" module in dashboard
- [x] Create `/learning/lessons` route and lesson detail modal

### Verification
- [x] Automated build check (resolved useToast/date-fns/lint errors)
- [x] Manual verification of multi-tenant isolation logic
- [x] Manual verification of recursive reply rendering
- [x] Authors can Edit and Delete own messages

==========================

Now, follow my implementation files. for each implementation you want to implement, use that file as the entry point. do not create any artifact on .gemini file or folder. example, use `FEATURES/files/phase1-feat1-threaded-lms-discussions.md` as you entry point for that implementation and use it to track all of your ahanges. 

DO NOT CREATE ANY ARTIFACT IN THE GEMINI FOLDER OR FILE. FOLLOW THIS STRICT RULE

lsof -ti:3000 | xargs -r kill -9
