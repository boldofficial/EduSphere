from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from academic.views.base import TenantViewSet
from core.tenant_utils import get_request_school
from learning.models import (
    QuestionBank, BankQuestion, BankOption, FillBlankAnswer,
    Exam, ExamPaper, ExamQuestion, ExamAnswer, ExamRoom
)
from learning.serializers_exam import (
    QuestionBankSerializer, QuestionBankDetailSerializer, BankQuestionSerializer,
    BankQuestionCreateSerializer, ExamSerializer, ExamDetailSerializer,
    ExamPaperSerializer, ExamQuestionSerializer, ExamAnswerSerializer,
    ExamGradingSerializer, ExamAnswerGradingSerializer
)


class QuestionBankViewSet(TenantViewSet):
    queryset = QuestionBank.objects.all()
    serializer_class = QuestionBankSerializer
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return QuestionBankDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return QuestionBankSerializer
        return QuestionBankSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Pass subject_name and school from request data to serializer
        if self.request and self.request.method in ["POST", "PATCH"]:
            context['subject_name'] = self.request.data.get('subject')
            context['school'] = get_request_school(self.request, allow_super_admin_tenant=True)
        return context
    
    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs


class BankQuestionViewSet(TenantViewSet):
    queryset = BankQuestion.objects.all()
    serializer_class = BankQuestionSerializer
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BankQuestionCreateSerializer
        return BankQuestionSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        bank_id = self.request.query_params.get("bank")
        difficulty = self.request.query_params.get("difficulty")
        topic = self.request.query_params.get("topic")
        
        if bank_id:
            qs = qs.filter(bank_id=bank_id)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if topic:
            qs = qs.filter(topic=topic)
        
        return qs


class ExamViewSet(TenantViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return ExamDetailSerializer
        return ExamSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get("subject")
        class_id = self.request.query_params.get("class")
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        status_filter = self.request.query_params.get("status")
        
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if class_id:
            qs = qs.filter(student_class_id=class_id)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs
    
    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Activate exam - creates exam papers for all students in class."""
        exam = self.get_object()
        from academic.models import Student
        
        if exam.status != "draft" and exam.status != "scheduled":
            return Response(
                {"error": "Can only activate draft or scheduled exams"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        students = Student.objects.filter(current_class=exam.student_class, status="active")
        
        papers_created = 0
        for student in students:
            if not ExamPaper.objects.filter(exam=exam, student=student).exists():
                ExamPaper.objects.create(exam=exam, student=student)
                papers_created += 1
        
        exam.status = "active"
        exam.save()
        
        return Response({
            "message": f"Exam activated. Created {papers_created} exam papers.",
            "papers_created": papers_created
        })
    
    @action(detail=True, methods=["post"])
    def add_questions(self, request, pk=None):
        """Add questions to exam from question bank or manually."""
        exam = self.get_object()
        question_data = request.data.get("questions", [])
        
        if exam.status != "draft":
            return Response(
                {"error": "Can only add questions to draft exams"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question_num = exam.exam_questions.count() + 1
        
        for q in question_data:
            ExamQuestion.objects.create(
                exam=exam,
                question_number=question_num,
                question_text=q.get("question_text", ""),
                question_type=q.get("question_type", "short"),
                marks=q.get("marks", 1),
                options=q.get("options", []),
                model_answer=q.get("model_answer", "")
            )
            question_num += 1
        
        return Response({"message": f"Added {len(question_data)} questions to exam"})


class ExamPaperViewSet(TenantViewSet):
    queryset = ExamPaper.objects.all()
    serializer_class = ExamPaperSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        exam_id = self.request.query_params.get("exam")
        student_id = self.request.query_params.get("student")
        status_filter = self.request.query_params.get("status")
        
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs.select_related("student", "exam")
    
    @action(detail=True, methods=["post"])
    def start_exam(self, request, pk=None):
        """Start exam for student - locks the paper."""
        paper = self.get_object()
        
        if paper.status != "not_started":
            return Response(
                {"error": f"Cannot start exam. Current status: {paper.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        import datetime
        paper.started_at = datetime.datetime.now()
        paper.status = "in_progress"
        
        # Get client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            paper.ip_address = x_forwarded_for.split(",")[0]
        else:
            paper.ip_address = request.META.get("REMOTE_ADDR")
        
        paper.save()
        
        # Return exam questions (without model answers for MCQ)
        exam_questions = paper.exam.exam_questions.all()
        # Hide correct answers
        for eq in exam_questions:
            if eq.question_type == "mcq":
                # Don't send which option is correct
                pass
        
        return Response({
            "status": "started",
            "started_at": paper.started_at,
            "duration_minutes": paper.exam.duration_minutes
        })
    
    @action(detail=True, methods=["post"])
    def submit_exam(self, request, pk=None):
        """Submit exam paper."""
        paper = self.get_object()
        
        if paper.status != "in_progress":
            return Response(
                {"error": "Exam not in progress"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process answers
        answers_data = request.data.get("answers", [])
        
        for ans in answers_data:
            question_id = ans.get("question_id")
            text_answer = ans.get("text_answer", "")
            selected_option = ans.get("selected_option")
            
            question = paper.exam.exam_questions.filter(id=question_id).first()
            if not question:
                continue
            
            exam_answer, _ = ExamAnswer.objects.update_or_create(
                paper=paper,
                question=question,
                defaults={
                    "text_answer": text_answer,
                    "selected_option": selected_option
                }
            )
            
            # Auto-grade MCQ
            if question.question_type == "mcq" and question.options:
                options = question.options
                if isinstance(options, list) and selected_option is not None:
                    try:
                        selected = options[selected_option]
                        if selected.get("is_correct"):
                            exam_answer.marks_obtained = question.marks
                            exam_answer.is_graded = True
                    except (IndexError, KeyError):
                        pass
                    exam_answer.save()
        
        import datetime
        paper.submitted_at = datetime.datetime.now()
        paper.status = "submitted"
        
        # Calculate total score
        total_score = sum(a.marks_obtained for a in paper.answers.all())
        paper.total_score = total_score
        
        if paper.exam.total_marks > 0:
            paper.percentage = (total_score / paper.exam.total_marks) * 100
        
        # Assign grade
        if paper.exam.grading_scheme:
            grade = paper.exam.grading_scheme.ranges.filter(
                min_score__lte=paper.percentage,
                max_score__gte=paper.percentage
            ).first()
            if grade:
                paper.grade = grade.grade
                paper.remark = grade.remark
        
        paper.save()
        
        return Response({
            "status": "submitted",
            "total_score": paper.total_score,
            "percentage": paper.percentage,
            "grade": paper.grade
        })


class ExamAnswerViewSet(TenantViewSet):
    queryset = ExamAnswer.objects.all()
    serializer_class = ExamAnswerSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        paper_id = self.request.query_params.get("paper")
        is_graded = self.request.query_params.get("is_graded")
        
        if paper_id:
            qs = qs.filter(paper_id=paper_id)
        if is_graded is not None:
            qs = qs.filter(is_graded=is_graded.lower() == "true")
        
        return qs.select_related("paper__student", "question", "graded_by")
    
    @action(detail=False, methods=["post"])
    def bulk_grade(self, request):
        """Bulk grade answers for a paper."""
        paper_id = request.data.get("paper_id")
        grades = request.data.get("grades", [])
        
        if not paper_id:
            return Response({"error": "paper_id required"}, status=400)
        
        paper = ExamPaper.objects.get(id=paper_id)
        
        for g in grades:
            answer_id = g.get("answer_id")
            marks = g.get("marks_obtained")
            feedback = g.get("feedback", "")
            
            try:
                answer = paper.answers.get(id=answer_id)
                answer.marks_obtained = marks
                answer.feedback = feedback
                answer.is_graded = True
                answer.save()
            except ExamAnswer.DoesNotExist:
                continue
        
        # Recalculate paper total
        total_score = sum(a.marks_obtained for a in paper.answers.all())
        paper.total_score = total_score
        
        if paper.exam.total_marks > 0:
            paper.percentage = (total_score / paper.exam.total_marks) * 100
        
        paper.save()
        
        return Response({
            "status": "graded",
            "total_score": total_score,
            "percentage": paper.percentage
        })