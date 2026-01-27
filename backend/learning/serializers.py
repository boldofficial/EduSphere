from rest_framework import serializers
from .models import Assignment, Submission, Quiz, Question, Option, Attempt, StudentAnswer

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'points', 'options']

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            Option.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        # Update question fields
        instance.text = validated_data.get('text', instance.text)
        instance.question_type = validated_data.get('question_type', instance.question_type)
        instance.points = validated_data.get('points', instance.points)
        instance.save()
        
        # Handle options if provided
        if options_data is not None:
            # 1. Update existing and create new
            incoming_ids = []
            for option_data in options_data:
                option_id = option_data.get('id', None)
                if option_id:
                    # Update existing
                    opt = Option.objects.get(id=option_id, question=instance)
                    opt.text = option_data.get('text', opt.text)
                    opt.is_correct = option_data.get('is_correct', opt.is_correct)
                    opt.save()
                    incoming_ids.append(opt.id)
                else:
                    # Create new
                    new_opt = Option.objects.create(question=instance, **option_data)
                    incoming_ids.append(new_opt.id)
            
            # 2. Delete options not in the incoming list
            # We filter by the question instance to ensure we don't delete other questions' options
            instance.options.exclude(id__in=incoming_ids).delete()
            
        return instance

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'student_class', 'subject', 'teacher', 
                  'duration_minutes', 'start_time', 'end_time', 'is_published', 'questions', 'created_at']

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = '__all__'

class AttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = ['id', 'quiz', 'student', 'start_time', 'submit_time', 'total_score', 'answers']
