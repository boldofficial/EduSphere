from django.urls import path
from .views import FeedbackCreateView, FeedbackListView, FeedbackStatsView

urlpatterns = [
    path("", FeedbackCreateView.as_view(), name="feedback-create"),
    path("list/", FeedbackListView.as_view(), name="feedback-list"),
    path("stats/", FeedbackStatsView.as_view(), name="feedback-stats"),
]
