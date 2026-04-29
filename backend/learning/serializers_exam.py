from rest_framework import serializers
from learning.models import (
    QuestionBank, BankQuestion, BankOption, FillBlankAnswer,
    Exam, ExamPaper, ExamQuestion, ExamAnswer, ExamRoom,
    Quiz, Question, Option, Attempt, StudentAnswer
)
from academic.models import Subject


class BankOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankOption
        fields = ["id", "text", "is_correct", "order"]


class FillBlankAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FillBlankAnswer
        fields = ["id", "answer", "is_exact"]


class QuestionBankSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionBank
        fields = ["id", "name", "description", "subject", "subject_name", "created_by", "questions_count", "created_at"]
        read_only_fields = ["created_by"]
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    
    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None
    
    def create(self, validated_data):
        # Auto-lookup or create subject by name
        subject_name = self.context.get('subject_name') or validated_data.get('subject')
        school = self.context.get('school')
        
        # If subject is already provided as ID, use it
        if 'subject' in validated_data and validated_data['subject']:
            pass  # Use the provided subject
        elif school and subject_name:
            # Try to find existing subject first
            subject = Subject.objects.filter(school=school, name__iexact=str(subject_name)).first()
            if subject:
                validated_data['subject'] = subject
            else:
                # Create new subject
                subject = Subject.objects.create(
                    school=school,
                    name=str(subject_name),
                    code=str(subject_name)[:3].upper()
                )
                validated_data['subject'] = subject
        
        # Set created_by from request
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user:
            validated_data['created_by'] = getattr(request.user, 'teacher', None)
        
        return super().create(validated_data)


class BankQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankQuestion
        fields = [
            "id", "question_text", "question_type", "difficulty", "points",
            "explanation", "topic", "tags", "created_at"
        ]


class QuestionBankDetailSerializer(QuestionBankSerializer):
    questions = BankQuestionSerializer(many=True, read_only=True)
    
    class Meta(QuestionBankSerializer.Meta):
        fields = QuestionBankSerializer.Meta.fields + ["questions"]


class BankQuestionCreateSerializer(serializers.ModelSerializer):
    options = BankOptionSerializer(many=True, required=False)
    accepted_answers = FillBlankAnswerSerializer(many=True, required=False)
    
    class Meta:
        model = BankQuestion
        fields = [
            "bank", "question_text", "question_type", "difficulty", "points",
            "explanation", "topic", "tags", "options", "accepted_answers"
        ]
    
    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        answers_data = validated_data.pop("accepted_answers", [])
        
        question = BankQuestion.objects.create(**validated_data)
        
        for opt_data in options_data:
            BankOption.objects.create(question=question, **opt_data)
        
        for ans_data in answers_data:
            FillBlankAnswer.objects.create(question=question, **ans_data)
        
        return question


# ==========================================
# EXAM SERIALIZERS
# ==========================================


class ExamQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamQuestion
        fields = [
            "id", "question_number", "question_text", "question_type", "marks", "options", "model_answer"
        ]


class ExamAnswerSerializer(serializers.ModelSerializer):
    graded_by_name = serializers.CharField(source="graded_by.name", read_only=True)
    
    class Meta:
        model = ExamAnswer
        fields = [
            "id", "question", "text_answer", "selected_option", "marks_obtained",
            "is_graded", "graded_by", "graded_by_name", "graded_at", "feedback"
        ]


class ExamPaperSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    answers = ExamAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExamPaper
        fields = [
            "id", "exam", "student", "student_name", "status", "started_at", "submitted_at",
            "total_score", "percentage", "grade", "remark", "ip_address", "is_locked", "answers"
        ]


class ExamSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="student_class.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    papers_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = [
            "id", "title", "description", "subject", "subject_name", "student_class", "class_name",
            "session", "term", "exam_date", "start_time", "end_time", "duration_minutes",
            "status", "total_marks", "passing_marks", "instructions", "created_by", "created_by_name",
            "grading_scheme", "papers_count", "created_at"
        ]
    
    def get_papers_count(self, obj):
        return obj.papers.count()


class ExamDetailSerializer(ExamSerializer):
    exam_questions = ExamQuestionSerializer(many=True, read_only=True)
    papers = ExamPaperSerializer(many=True, read_only=True)
    
    class Meta(ExamSerializer.Meta):
        fields = ExamSerializer.Meta.fields + ["exam_questions", "papers"]


class ExamGradingSerializer(serializers.ModelSerializer):
    answers = ExamAnswerSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source="student.names", read_only=True)
    
    class Meta:
        model = ExamPaper
        fields = [
            "id", "student", "student_name", "status", "started_at", "submitted_at",
            "total_score", "percentage", "grade", "remark", "answers"
        ]
    read_only_fields = ["student", "started_at", "submitted_at"]


class ExamAnswerGradingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAnswer
        fields = ["marks_obtained", "feedback", "is_graded"]
    
    def update(self, instance, validated_data):
        from django.utils import timezone
        from academic.models import Teacher
        
        user = self.context["request"].user
        try:
            teacher = Teacher.objects.get(user=user)
            instance.graded_by = teacher
        except Teacher.DoesNotExist:
            pass
        
        instance.graded_at = timezone.now()
        return super().update(instance, validated_data)