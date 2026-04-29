from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssignmentViewSet, AttemptViewSet, QuestionViewSet, QuizViewSet, SubmissionViewSet
from .views_exam import (
    QuestionBankViewSet, BankQuestionViewSet,
    ExamViewSet, ExamPaperViewSet, ExamAnswerViewSet
)

router = DefaultRouter()
router.register(r"assignments", AssignmentViewSet)
router.register(r"submissions", SubmissionViewSet)
router.register(r"quizzes", QuizViewSet)
router.register(r"attempts", AttemptViewSet)
router.register(r"questions", QuestionViewSet)
# New exam endpoints
router.register(r"question-banks", QuestionBankViewSet)
router.register(r"bank-questions", BankQuestionViewSet)
router.register(r"exams", ExamViewSet)
router.register(r"exam-papers", ExamPaperViewSet)
router.register(r"exam-answers", ExamAnswerViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
