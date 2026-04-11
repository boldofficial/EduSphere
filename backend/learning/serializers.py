from rest_framework import serializers

from academic.models import Class, Student, Subject, Teacher
from core.tenant_utils import get_request_school

from .models import Assignment, Attempt, ExamViolation, Option, Question, Quiz, StudentAnswer, Submission


def _school_from_request(serializer):
    request = serializer.context.get("request")
    if not request:
        return None
    try:
        return get_request_school(request, allow_super_admin_tenant=True)
    except Exception:
        return None


class AssignmentSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url

        if instance.attachment_url:
            ret["attachment_url"] = get_media_url(instance.attachment_url)
        if hasattr(instance, "image_url") and instance.image_url:
            ret["image_url"] = get_media_url(instance.image_url)
        return ret

    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["student_class"].queryset = Class.objects.filter(school=school)
            self.fields["subject"].queryset = Subject.objects.filter(school=school)
            self.fields["teacher"].queryset = Teacher.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        for field in ("student_class", "subject", "teacher"):
            value = attrs.get(field)
            if school and value and value.school != school:
                raise serializers.ValidationError({field: f"{field} must belong to your school."})
        return attrs


class SubmissionSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url

        if instance.submission_file:
            ret["submission_file"] = get_media_url(instance.submission_file)
        return ret

    class Meta:
        model = Submission
        fields = "__all__"
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["assignment"].queryset = Assignment.objects.filter(school=school)
            self.fields["student"].queryset = Student.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        assignment = attrs.get("assignment")
        student = attrs.get("student")
        if school and assignment and assignment.school != school:
            raise serializers.ValidationError({"assignment": "Assignment must belong to your school."})
        if school and student and student.school != school:
            raise serializers.ValidationError({"student": "Student must belong to your school."})
        return attrs


class OptionSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Option
        fields = ["id", "text", "is_correct", "school"]
        read_only_fields = ("school",)


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["id", "quiz", "text", "question_type", "points", "options", "school"]
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["quiz"].queryset = Quiz.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        quiz = attrs.get("quiz")
        if school and quiz and quiz.school != school:
            raise serializers.ValidationError({"quiz": "Quiz must belong to your school."})
        return attrs

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        question = Question.objects.create(**validated_data)
        school = validated_data.get("school")

        # Only create options for MCQ and if text is not empty
        if validated_data.get("question_type") == "mcq":
            for option_data in options_data:
                if option_data.get("text"):
                    Option.objects.create(question=question, school=school, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)

        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle options if provided
        if options_data is not None:
            if instance.question_type == "theory":
                # Delete all options if converted to theory
                instance.options.all().delete()
            else:
                # 1. Update existing and create new
                incoming_ids = []
                for option_data in options_data:
                    # Skip empty options
                    if not option_data.get("text"):
                        continue

                    option_id = option_data.get("id", None)
                    if option_id:
                        # Update existing
                        try:
                            opt = Option.objects.get(id=option_id, question=instance)
                            opt.text = option_data.get("text", opt.text)
                            opt.is_correct = option_data.get("is_correct", opt.is_correct)
                            opt.save()
                            incoming_ids.append(opt.id)
                        except Option.DoesNotExist:
                            pass
                    else:
                        # Create new
                        new_opt = Option.objects.create(question=instance, school=instance.school, **option_data)
                        incoming_ids.append(new_opt.id)

                # 2. Delete options not in the incoming list
                instance.options.exclude(id__in=incoming_ids).delete()

        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "student_class",
            "subject",
            "teacher",
            "duration_minutes",
            "start_time",
            "end_time",
            "is_published",
            "questions",
            "created_at",
            "school",
        ]
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["student_class"].queryset = Class.objects.filter(school=school)
            self.fields["subject"].queryset = Subject.objects.filter(school=school)
            self.fields["teacher"].queryset = Teacher.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        for field in ("student_class", "subject", "teacher"):
            value = attrs.get(field)
            if school and value and value.school != school:
                raise serializers.ValidationError({field: f"{field} must belong to your school."})
        return attrs


class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = "__all__"
        read_only_fields = ("school",)


class ExamViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamViolation
        fields = ["id", "attempt", "count", "timestamp", "auto_submitted", "school"]
        read_only_fields = ("school", "timestamp", "auto_submitted")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["attempt"].queryset = Attempt.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        attempt = attrs.get("attempt")
        if school and attempt and attempt.school != school:
            raise serializers.ValidationError({"attempt": "Attempt must belong to your school."})
        return attrs


class AttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = [
            "id", "quiz", "student", "start_time", "submit_time", 
            "total_score", "answers", "school", "violation_count", "is_violated"
        ]
        read_only_fields = ("school",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields["quiz"].queryset = Quiz.objects.filter(school=school)
            self.fields["student"].queryset = Student.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get("school") or _school_from_request(self)
        quiz = attrs.get("quiz")
        student = attrs.get("student")
        if school and quiz and quiz.school != school:
            raise serializers.ValidationError({"quiz": "Quiz must belong to your school."})
        if school and student and student.school != school:
            raise serializers.ValidationError({"student": "Student must belong to your school."})
        return attrs
