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
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), required=False, allow_null=True)
    subject_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = QuestionBank
        fields = [
            "id", "name", "description", "subject", "subject_name", "subject_input",
            "created_by", "questions_count", "created_at"
        ]
        read_only_fields = ["created_by"]
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    
    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None
    
    def create(self, validated_data):
        # Auto-lookup or create subject by name when subject id is not provided.
        subject_name = validated_data.pop("subject_input", None) or self.context.get("subject_name")
        school = self.context.get('school')

        # If subject is already provided as ID, use it.
        if validated_data.get("subject"):
            pass
        elif school and subject_name:
            subject = Subject.objects.filter(school=school, name__iexact=str(subject_name)).first()
            if subject:
                validated_data["subject"] = subject
            else:
                subject = Subject.objects.create(
                    school=school,
                    name=str(subject_name)
                )
                validated_data["subject"] = subject
        else:
            raise serializers.ValidationError({"subject": "Provide a valid subject id or subject_input."})
        
        # Set created_by from request
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user:
            validated_data['created_by'] = getattr(request.user, 'teacher', None)
        
        return super().create(validated_data)


class BankQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    correct_answer = serializers.SerializerMethodField()

    class Meta:
        model = BankQuestion
        fields = [
            "id", "question_text", "question_type", "difficulty", "points",
            "explanation", "topic", "tags", "options", "correct_answer", "created_at"
        ]

    def get_options(self, obj):
        option_qs = obj.options.order_by("order", "id").all()
        if not option_qs:
            return {}
        labels = ["a", "b", "c", "d", "e", "f"]
        data = {}
        for idx, opt in enumerate(option_qs):
            key = labels[idx] if idx < len(labels) else str(idx + 1)
            data[key] = opt.text
        return data

    def get_correct_answer(self, obj):
        correct = obj.options.filter(is_correct=True).order_by("order", "id").first()
        if not correct:
            return None
        option_ids = list(obj.options.order_by("order", "id").values_list("id", flat=True))
        labels = ["a", "b", "c", "d", "e", "f"]
        try:
            idx = option_ids.index(correct.id)
            return labels[idx] if idx < len(labels) else str(idx + 1)
        except ValueError:
            return None


class QuestionBankDetailSerializer(QuestionBankSerializer):
    questions = BankQuestionSerializer(many=True, read_only=True)
    
    class Meta(QuestionBankSerializer.Meta):
        fields = QuestionBankSerializer.Meta.fields + ["questions"]


class BankQuestionCreateSerializer(serializers.ModelSerializer):
    options = serializers.JSONField(required=False)
    accepted_answers = FillBlankAnswerSerializer(many=True, required=False)
    correct_answer = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = BankQuestion
        fields = [
            "bank", "question_text", "question_type", "difficulty", "points",
            "explanation", "topic", "tags", "options", "accepted_answers", "correct_answer"
        ]
    
    def create(self, validated_data):
        correct_answer = (validated_data.pop("correct_answer", "") or "").strip().lower()
        options_data = validated_data.pop("options", [])
        answers_data = validated_data.pop("accepted_answers", [])

        # Accept frontend map format: {"a":"...", "b":"..."} and normalize to serializer list shape.
        if isinstance(options_data, dict):
            normalized_options = []
            order_map = ["a", "b", "c", "d", "e", "f"]
            for idx, key in enumerate(order_map):
                text = options_data.get(key)
                if text:
                    normalized_options.append(
                        {
                            "text": text,
                            "order": idx,
                            "is_correct": key == correct_answer,
                        }
                    )
            options_data = normalized_options

        question = BankQuestion.objects.create(**validated_data)

        if question.question_type == "true_false" and not options_data:
            options_data = [
                {"text": "True", "order": 0, "is_correct": correct_answer == "true"},
                {"text": "False", "order": 1, "is_correct": correct_answer == "false"},
            ]

        for opt_data in options_data:
            BankOption.objects.create(question=question, school=question.school, **opt_data)

        for ans_data in answers_data:
            FillBlankAnswer.objects.create(question=question, school=question.school, **ans_data)
        
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
