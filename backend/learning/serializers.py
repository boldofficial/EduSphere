from rest_framework import serializers
from .models import Assignment, Submission, Quiz, Question, Option, Attempt, StudentAnswer

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ('school',)

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ('school',)

class OptionSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, allow_blank=True)
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct', 'school']
        read_only_fields = ('school',)

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'question_type', 'points', 'options', 'school']
        read_only_fields = ('school',)

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        school = validated_data.get('school')
        
        # Only create options for MCQ and if text is not empty
        if validated_data.get('question_type') == 'mcq':
            for option_data in options_data:
                if option_data.get('text'):
                    Option.objects.create(question=question, school=school, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle options if provided
        if options_data is not None:
            if instance.question_type == 'theory':
                # Delete all options if converted to theory
                instance.options.all().delete()
            else:
                # 1. Update existing and create new
                incoming_ids = []
                for option_data in options_data:
                    # Skip empty options
                    if not option_data.get('text'):
                        continue
                        
                    option_id = option_data.get('id', None)
                    if option_id:
                        # Update existing
                        try:
                            opt = Option.objects.get(id=option_id, question=instance)
                            opt.text = option_data.get('text', opt.text)
                            opt.is_correct = option_data.get('is_correct', opt.is_correct)
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
        fields = ['id', 'title', 'description', 'student_class', 'subject', 'teacher', 
                  'duration_minutes', 'start_time', 'end_time', 'is_published', 'questions', 'created_at', 'school']
        read_only_fields = ('school',)

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = '__all__'
        read_only_fields = ('school',)

class AttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Attempt
        fields = ['id', 'quiz', 'student', 'start_time', 'submit_time', 'total_score', 'answers', 'school']
        read_only_fields = ('school',)
