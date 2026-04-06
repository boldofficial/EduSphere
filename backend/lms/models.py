from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from academic.models import TenantModel

class DiscussionThread(TenantModel):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["school", "content_type", "object_id"],
                name="unique_thread_per_resource"
            )
        ]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"Thread for {self.content_object}"

class DiscussionMessage(TenantModel):
    thread = models.ForeignKey(DiscussionThread, related_name="messages", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    parent = models.ForeignKey("self", null=True, blank=True, related_name="replies", on_delete=models.CASCADE)
    body = models.TextField()

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author} - {self.body[:50]}"
