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
- [ ] Thread loads inline below assignment/study material
- [ ] Users can post top-level comments
- [ ] Users can reply to any comment (one level of nesting minimum)
- [ ] Authors can delete their own messages
- [ ] Thread is scoped — each material/assignment has its own thread



==========================

## Status Tracker [/]

### Backend Implementation
- [ ] Create `DiscussionThread` and `DiscussionMessage` models in `lms/models.py`
- [ ] Create serializers in `lms/serializers.py`
- [ ] Create API ViewSets in `lms/views.py`
- [ ] Register new models in Django Admin

### Frontend Implementation
- [ ] Create `DiscussionThread.tsx` component
- [ ] Create `DiscussionMessage.tsx` recursive component
- [ ] Integrate into `Assignment` detail page
- [ ] Integrate into `StudyMaterial` detail page

### Verification
- [ ] Manual test: Post top-level comment
- [ ] Manual test: Post nested reply
- [ ] Manual test: Authors can delete own messages

==========================

Now, follow my implementation files. for each implementation you want to implement, use that file as the entry point. do not create any artifact on .gemini file or folder. example, use `FEATURES/files/phase1-feat1-threaded-lms-discussions.md` as you entry point for that implementation and use it to track all of your ahanges. 

DO NOT CREATE ANY ARTIFACT IN THE GEMINI FOLDER OR FILE. FOLLOW THIS STRICT RULE