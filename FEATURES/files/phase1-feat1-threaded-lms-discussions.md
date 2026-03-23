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
