from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from schools.models import School


class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="feedback")
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="feedback")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    page_url = models.CharField(max_length=500, blank=True)
    user_role = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feedback"
        ordering = ["-created_at"]

    def __str__(self):
        school_name = self.school.name if self.school else "No school"
        return f"{self.user} — {self.rating}★ ({school_name})"
