from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Assignment, Submission, Quiz, Question, Option, Attempt, StudentAnswer
from .serializers import (
    AssignmentSerializer, SubmissionSerializer, QuizSerializer, 
    QuestionSerializer, AttemptSerializer, StudentAnswerSerializer
)

class LearningTenantViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(school=self.request.user.school)
        else:
            serializer.save()

class AssignmentViewSet(LearningTenantViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        # Filtering logic for students vs teachers can be added here
        return Assignment.objects.filter(school=self.request.user.school)

class SubmissionViewSet(LearningTenantViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        return Submission.objects.filter(school=self.request.user.school)

class QuizViewSet(LearningTenantViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    def get_queryset(self):
        return Quiz.objects.filter(school=self.request.user.school)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit an attempt for a quiz"""
        quiz = self.get_object()
        student = request.user.student_profile
        if not student:
            return Response({'detail': 'Only students can take quizzes'}, status=status.HTTP_403_FORBIDDEN)
        
        # Calculate score (simple MCQ auto-grading)
        answers_data = request.data.get('answers', [])
        total_score = 0
        
        attempt = Attempt.objects.create(
            school=quiz.school,
            quiz=quiz,
            student=student,
            submit_time=timezone.now()
        )

        for ans in answers_data:
            question_id = ans.get('question_id')
            option_id = ans.get('selected_option_id')
            text_answer = ans.get('text_answer', '')
            
            question = Question.objects.get(id=question_id)
            score = 0
            
            if question.question_type == 'mcq' and option_id:
                option = Option.objects.get(id=option_id)
                if option.is_correct:
                    score = question.points
                    
            total_score += score
            
            StudentAnswer.objects.create(
                school=quiz.school,
                attempt=attempt,
                question=question,
                selected_option_id=option_id,
                text_answer=text_answer,
                score=score
            )
            
        attempt.total_score = total_score
        attempt.save()
        
        return Response({'success': True, 'score': total_score})

class QuestionViewSet(LearningTenantViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def get_queryset(self):
        # Allow filtering by quiz_id
        queryset = Question.objects.filter(quiz__school=self.request.user.school)
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset

class AttemptViewSet(LearningTenantViewSet):
    queryset = Attempt.objects.all()
    serializer_class = AttemptSerializer

    def get_queryset(self):
        return Attempt.objects.filter(school=self.request.user.school)
