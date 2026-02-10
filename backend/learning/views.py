from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Assignment, Submission, Quiz, Question, Option, Attempt, StudentAnswer
from .serializers import (
    AssignmentSerializer, SubmissionSerializer, QuizSerializer, 
    QuestionSerializer, AttemptSerializer, StudentAnswerSerializer
)
from core.pagination import StandardPagination, LargePagination


class LearningTenantViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        """Base tenant-filtered queryset — prevents cross-school data leaks."""
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        if user.is_superuser:
            return self.queryset.all()
        if hasattr(user, 'school') and user.school:
            return self.queryset.filter(school=user.school)
        return self.queryset.none()

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(school=self.request.user.school)
        else:
            serializer.save()


class AssignmentViewSet(LearningTenantViewSet):
    queryset = Assignment.objects.select_related('student_class', 'subject', 'teacher', 'school').all()
    serializer_class = AssignmentSerializer


class SubmissionViewSet(LearningTenantViewSet):
    queryset = Submission.objects.select_related('assignment', 'student', 'school').all()
    serializer_class = SubmissionSerializer


class QuizViewSet(LearningTenantViewSet):
    queryset = Quiz.objects.select_related('student_class', 'subject', 'teacher', 'school').all()
    serializer_class = QuizSerializer

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit an attempt for a quiz"""
        quiz = self.get_object()
        
        # Ensure user is a student
        student = getattr(request.user, 'student_profile', None)
        if not student:
            return Response({'detail': 'Only students can take quizzes'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if quiz has already been attempted
        if Attempt.objects.filter(quiz=quiz, student=student).exists():
            return Response({'detail': 'You have already submitted this quiz'}, status=status.HTTP_400_BAD_REQUEST)
        
        answers_data = request.data.get('answers', [])
        if not answers_data:
            return Response({'detail': 'No answers provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        total_score = 0
        
        attempt = Attempt.objects.create(
            school=quiz.school,
            quiz=quiz,
            student=student,
            submit_time=timezone.now()
        )

        errors = []
        for ans in answers_data:
            question_id = ans.get('question_id')
            option_id = ans.get('selected_option_id')
            text_answer = ans.get('text_answer', '')
            
            # Safe lookup — no crash on bad IDs
            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
            except Question.DoesNotExist:
                errors.append(f"Question {question_id} not found in this quiz")
                continue
            
            score = 0
            selected_option = None
            
            if question.question_type == 'mcq' and option_id:
                try:
                    option = Option.objects.get(id=option_id, question=question)
                    selected_option = option
                    if option.is_correct:
                        score = question.points
                except Option.DoesNotExist:
                    errors.append(f"Option {option_id} not found for question {question_id}")
                    continue
                    
            total_score += score
            
            StudentAnswer.objects.create(
                school=quiz.school,
                attempt=attempt,
                question=question,
                selected_option=selected_option,
                text_answer=text_answer,
                score=score
            )
            
        attempt.total_score = total_score
        attempt.save()
        
        result = {'success': True, 'score': total_score}
        if errors:
            result['warnings'] = errors
        return Response(result)


class QuestionViewSet(LearningTenantViewSet):
    queryset = Question.objects.select_related('quiz', 'school').prefetch_related('options').all()
    serializer_class = QuestionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset


class AttemptViewSet(LearningTenantViewSet):
    queryset = Attempt.objects.select_related('quiz', 'student', 'school').prefetch_related('answers').all()
    serializer_class = AttemptSerializer

