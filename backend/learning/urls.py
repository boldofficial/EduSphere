from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssignmentViewSet, AttemptViewSet, QuestionViewSet, QuizViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r"assignments", AssignmentViewSet)
router.register(r"submissions", SubmissionViewSet)
router.register(r"quizzes", QuizViewSet)
router.register(r"attempts", AttemptViewSet)
router.register(r"questions", QuestionViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
