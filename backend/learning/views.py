from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from academic.views.base import learner_class_ids, scope_to_learner
from core.pagination import StandardPagination
from core.permissions import EveryoneReadStaffWrite, is_learner
from core.tenant_utils import get_request_school

from django.conf import settings

from .models import Assignment, Attempt, ExamViolation, Option, Question, Quiz, StudentAnswer, Submission
from .serializers import (
    AssignmentSerializer,
    AttemptSerializer,
    ExamViolationSerializer,
    QuestionSerializer,
    QuizSerializer,
    SubmissionSerializer,
)


class LearningTenantViewSet(viewsets.ModelViewSet):
    # Everyone in the school can read; only staff create or change learning content.
    permission_classes = [permissions.IsAuthenticated, EveryoneReadStaffWrite]
    pagination_class = StandardPagination

    def _enforce_related_school(self, value, school, field_name="field"):
        if value is None or school is None:
            return

        if hasattr(value, "school"):
            related_school = getattr(value, "school", None)
            if related_school and related_school != school:
                raise PermissionDenied(f"{field_name} must belong to your school.")
            return

        if isinstance(value, dict):
            for key, item in value.items():
                self._enforce_related_school(item, school, f"{field_name}.{key}")
            return

        if isinstance(value, (list, tuple, set)):
            for index, item in enumerate(value):
                self._enforce_related_school(item, school, f"{field_name}[{index}]")

    def get_queryset(self):
        """Base tenant-filtered queryset — prevents cross-school data leaks."""
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        if user.is_superuser:
            school = get_request_school(self.request, allow_super_admin_tenant=True)
            return self.queryset.filter(school=school) if school else self.queryset.all()
        school = get_request_school(self.request, allow_super_admin_tenant=False)
        if school:
            return self.queryset.filter(school=school)
        return self.queryset.none()

    def perform_create(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        for field_name, value in serializer.validated_data.items():
            self._enforce_related_school(value, school, field_name)
        if school:
            serializer.save(school=school)
        else:
            raise PermissionDenied("School context not found.")

    def perform_update(self, serializer):
        school = get_request_school(self.request, allow_super_admin_tenant=True)
        for field_name, value in serializer.validated_data.items():
            self._enforce_related_school(value, school, field_name)
        super().perform_update(serializer)


class AssignmentViewSet(LearningTenantViewSet):
    queryset = Assignment.objects.select_related("student_class", "subject", "teacher", "school").all()
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if is_learner(self.request.user):
            qs = qs.filter(student_class_id__in=learner_class_ids(self.request.user))
        return qs


from academic.ai_utils import AcademicAI


class SubmissionViewSet(LearningTenantViewSet):
    queryset = Submission.objects.select_related("assignment", "student", "school").all()
    serializer_class = SubmissionSerializer
    learner_actions = ("create",)  # students hand in work; grading stays with staff

    def get_queryset(self):
        qs = super().get_queryset()
        if is_learner(self.request.user):
            qs = scope_to_learner(qs, self.request.user)
        return qs

    def perform_create(self, serializer):
        if is_learner(self.request.user):
            student = getattr(self.request.user, "student_profile", None)
            if not student:
                raise PermissionDenied("Only students can submit assignments.")
            serializer.save(school=student.school, student=student, score=None, feedback="")
            return
        super().perform_create(serializer)

    @action(detail=True, methods=["post"], url_path="ai-evaluate")
    def ai_evaluate(self, request, pk=None):
        """AI-powered grading for theory assignments."""
        submission = self.get_object()
        assignment = submission.assignment

        if not submission.submission_text:
            return Response({"detail": "No text found in submission to evaluate"}, status=status.HTTP_400_BAD_REQUEST)

        ai_data = {
            "question": f"{assignment.title}: {assignment.description}",
            "answer": submission.submission_text,
            "max_points": assignment.points,
            "rubric": "",  # Could be expanded later if rubric field exists
        }

        ai = AcademicAI()
        evaluation = ai.evaluate_submission(ai_data)

        if not evaluation:
            return Response({"detail": "AI evaluation failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"suggestion": evaluation, "context": ai_data})


class QuizViewSet(LearningTenantViewSet):
    queryset = Quiz.objects.select_related("student_class", "subject", "teacher", "school").all()
    serializer_class = QuizSerializer
    learner_actions = ("start_attempt", "submit")

    def get_queryset(self):
        qs = super().get_queryset()
        if is_learner(self.request.user):
            # Learners only see published quizzes for their (or their children's) class.
            qs = qs.filter(is_published=True, student_class_id__in=learner_class_ids(self.request.user))
        return qs

    @action(detail=False, methods=["post"], url_path="generate-from-lesson")
    def generate_from_lesson(self, request):
        """
        AI-powered quiz generation from lesson content.
        Body: { "lesson_id": "...", "num_questions": 5, "difficulty": "medium" }
        """
        from academic.models import Lesson

        lesson_id = request.data.get("lesson_id")
        num_questions = request.data.get("num_questions", 5)
        difficulty = request.data.get("difficulty", "medium")

        if not lesson_id:
            return Response({"error": "lesson_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        school = get_request_school(request)
        if not school:
            return Response({"error": "School context not found"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lesson = Lesson.objects.select_related("subject", "student_class").get(id=lesson_id, school=school)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found"}, status=status.HTTP_404_NOT_FOUND)

        if not lesson.content:
            return Response(
                {"error": "Lesson has no text content to generate quiz from"}, status=status.HTTP_400_BAD_REQUEST
            )

        ai = AcademicAI()
        questions_data = ai.generate_quiz_from_content(
            content_text=lesson.content,
            subject_name=lesson.subject.name if lesson.subject else "General",
            num_questions=num_questions,
            difficulty=difficulty,
        )

        if not questions_data:
            return Response(
                {"error": "AI quiz generation failed. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        teacher = getattr(request.user, "teacher_profile", None)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                school=school,
                title=f"Quiz: {lesson.title}",
                description=f"Auto-generated from lesson: {lesson.title}",
                student_class=lesson.student_class,
                subject=lesson.subject,
                teacher=teacher,
                duration_minutes=30,
                start_time=timezone.now(),
                end_time=timezone.now() + timezone.timedelta(days=7),
                is_published=False,
            )

            for q_data in questions_data:
                question = Question.objects.create(
                    school=school,
                    quiz=quiz,
                    text=q_data.get("text", ""),
                    question_type="mcq",
                    points=q_data.get("points", 1),
                )
                for opt_data in q_data.get("options", []):
                    Option.objects.create(
                        school=school,
                        question=question,
                        text=opt_data.get("text", ""),
                        is_correct=opt_data.get("is_correct", False),
                    )

        serializer = self.get_serializer(quiz)
        return Response(
            {"success": True, "message": f"Quiz created with {len(questions_data)} questions", "quiz": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def start_attempt(self, request, pk=None):
        """Starts a new attempt for a quiz or returns existing if not submitted."""
        quiz = self.get_object()
        student = getattr(request.user, "student_profile", None)

        if not student:
            return Response({"detail": "Only students can start quiz attempts"}, status=status.HTTP_403_FORBIDDEN)

        # Ensure correct school context
        if student.school != quiz.school:
            return Response({"detail": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        # Check for existing attempt
        attempt = Attempt.objects.filter(quiz=quiz, student=student).first()

        if attempt:
            if attempt.submit_time:
                return Response({"detail": "You have already submitted this quiz."}, status=status.HTTP_400_BAD_REQUEST)
            # Resume existing
            from .serializers import AttemptSerializer

            serializer = AttemptSerializer(attempt)
            return Response(serializer.data)

        # Create new
        attempt = Attempt.objects.create(school=quiz.school, quiz=quiz, student=student, start_time=timezone.now())
        from .serializers import AttemptSerializer

        serializer = AttemptSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Submit an attempt for a quiz. Scores are computed here; clients never send them."""
        quiz = self.get_object()

        student = getattr(request.user, "student_profile", None)
        if not student:
            return Response({"detail": "Only students can take quizzes"}, status=status.HTTP_403_FORBIDDEN)
        if student.school != quiz.school:
            return Response({"detail": "Cross-tenant quiz access denied"}, status=status.HTTP_403_FORBIDDEN)
        if not quiz.is_published:
            return Response({"detail": "This quiz is not open."}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        if quiz.start_time and now < quiz.start_time:
            return Response({"detail": "This quiz has not started yet."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            attempt, created = Attempt.objects.select_for_update().get_or_create(
                school=quiz.school, quiz=quiz, student=student, defaults={"start_time": now}
            )
            if attempt.submit_time:
                return Response({"detail": "You have already submitted this quiz"}, status=status.HTTP_400_BAD_REQUEST)

            # Late submissions (after the quiz closes, or past the time limit plus a 2-minute grace)
            # are recorded but flagged so teachers can decide, instead of passing as on time.
            grace = timezone.timedelta(minutes=2)
            deadline = attempt.start_time + timezone.timedelta(minutes=quiz.duration_minutes or 0) + grace
            if quiz.end_time:
                deadline = min(deadline, quiz.end_time + grace)
            is_late = now > deadline

            questions = {q.id: q for q in quiz.questions.prefetch_related("options")}
            attempt.answers.all().delete()

            errors = []
            total_score = 0
            seen = set()
            new_answers = []
            for ans in request.data.get("answers", []):
                question = questions.get(_as_int(ans.get("question_id")))
                if question is None:
                    errors.append(f"Question {ans.get('question_id')} not found in this quiz")
                    continue
                if question.id in seen:
                    continue  # one answer per question; duplicates are ignored, not scored again
                seen.add(question.id)

                score = 0
                selected_option = None
                option_id = _as_int(ans.get("selected_option_id"))
                if question.question_type == "mcq" and option_id:
                    selected_option = next((o for o in question.options.all() if o.id == option_id), None)
                    if selected_option is None:
                        errors.append(f"Option {option_id} not found for question {question.id}")
                        continue
                    if selected_option.is_correct:
                        score = question.points

                total_score += score
                new_answers.append(
                    StudentAnswer(
                        school=quiz.school,
                        attempt=attempt,
                        question=question,
                        selected_option=selected_option,
                        text_answer=ans.get("text_answer", ""),
                        score=score,
                    )
                )

            StudentAnswer.objects.bulk_create(new_answers)
            attempt.submit_time = now
            attempt.total_score = total_score
            attempt.save()

        result = {"success": True, "score": total_score, "late": is_late}
        if errors:
            result["warnings"] = errors
        return Response(result)


def _as_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class QuestionViewSet(LearningTenantViewSet):
    queryset = Question.objects.select_related("quiz", "school").prefetch_related("options").all()
    serializer_class = QuestionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if is_learner(self.request.user):
            # Only questions of published quizzes for the learner's class; answer keys are hidden
            # by OptionSerializer.
            queryset = queryset.filter(
                quiz__is_published=True, quiz__student_class_id__in=learner_class_ids(self.request.user)
            )
        quiz_id = self.request.query_params.get("quiz_id")
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset


class AttemptViewSet(LearningTenantViewSet):
    queryset = Attempt.objects.select_related("quiz", "student", "school").prefetch_related("answers__question").all()
    serializer_class = AttemptSerializer
    learner_actions = ("violations",)  # the exam screen logs tab switches on the student's own attempt

    def get_queryset(self):
        qs = super().get_queryset()
        if is_learner(self.request.user):
            qs = scope_to_learner(qs, self.request.user)
        return qs

    @action(detail=True, methods=["post"], url_path="ai-grade-theory")
    def ai_grade_theory(self, request, pk=None):
        """Grades all theory questions in an attempt using AI"""
        attempt = self.get_object()
        theory_answers = attempt.answers.filter(question__question_type="theory")

        if not theory_answers.exists():
            return Response({"detail": "No theory questions found in this attempt"}, status=status.HTTP_400_BAD_REQUEST)

        ai = AcademicAI()
        results = []

        with transaction.atomic():
            for ans in theory_answers:
                ai_data = {
                    "question": ans.question.text,
                    "answer": ans.text_answer,
                    "max_points": ans.question.points,
                    "rubric": "",
                }

                evaluation = ai.evaluate_submission(ai_data)
                if evaluation:
                    ans.score = evaluation.get("score", 0.0)
                    # We might want to store AI feedback somewhere, for now we can append to a theoretical feedback field if it existed
                    # but StudentAnswer doesn't have feedback. We could add it or just return it.
                    ans.save()
                    results.append(
                        {
                            "question_id": ans.question.id,
                            "question_text": ans.question.text,
                            "suggested_score": evaluation.get("score"),
                            "feedback": evaluation.get("feedback"),
                        }
                    )

            # Recalculate total score for attempt
            attempt.total_score = sum(a.score for a in attempt.answers.all())
            attempt.save()

        return Response({"success": True, "evaluations": results, "new_total_score": attempt.total_score})

    @action(detail=True, methods=["post", "get"])
    def violations(self, request, pk=None):
        """Log or retrieve tab-switch violations for a specific attempt."""
        attempt = self.get_object()

        if request.method == "GET":
            # For teachers/admins to view violation logs for this attempt
            violations = attempt.violations.all().order_by("-timestamp")
            serializer = ExamViolationSerializer(violations, many=True, context={"request": request})
            return Response(serializer.data)

        # POST logic: Student logging a violation
        count = request.data.get("count", 1)  # Usually frontend tracks the count and sends it

        # Save violation
        violation = ExamViolation.objects.create(
            school=attempt.school,
            attempt=attempt,
            count=count,
        )

        max_violations = getattr(settings, "CBT_MAX_VIOLATIONS", 3)
        auto_submit = False

        # Check threshold
        if count >= max_violations and not attempt.submit_time:
            # Force submission
            attempt.submit_time = timezone.now()
            # Calculate score using existing answers just in case
            attempt.total_score = sum(a.score for a in attempt.answers.all())
            attempt.save()

            violation.auto_submitted = True
            violation.save()
            auto_submit = True

        return Response(
            {"success": True, "auto_submitted": auto_submit, "message": "Violation logged securely."},
            status=status.HTTP_201_CREATED,
        )
