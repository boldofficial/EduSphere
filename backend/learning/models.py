from django.db import models
from academic.models import TenantModel, Class, Subject, Teacher, Student

class Assignment(TenantModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name='assignments')
    due_date = models.DateTimeField()
    points = models.IntegerField(default=100)
    attachment_url = models.CharField(max_length=512, blank=True, null=True)  # Legacy/General attachment
    video_url = models.URLField(max_length=512, blank=True, null=True)
    image_url = models.URLField(max_length=512, blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.student_class.name}"

class Submission(TenantModel):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions')
    submission_text = models.TextField(blank=True)
    submission_file = models.CharField(max_length=512, blank=True, null=True)
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"Submission: {self.student.names} - {self.assignment.title}"

# ==========================================
# CBT (Computer Based Testing)
# ==========================================

class Quiz(TenantModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='quizzes')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='quizzes')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name='quizzes')
    duration_minutes = models.IntegerField(default=60)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_published = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Quiz: {self.title} ({self.student_class.name})"

class Question(TenantModel):
    TYPE_CHOICES = (
        ('mcq', 'Multiple Choice'),
        ('theory', 'Theory'),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='mcq')
    points = models.IntegerField(default=1)
    
    def __str__(self):
        return f"{self.quiz.title} - Q: {self.text[:50]}"

class Option(TenantModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.text} ({'Correct' if self.is_correct else 'Wrong'})"

class Attempt(TenantModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='quiz_attempts')
    start_time = models.DateTimeField(auto_now_add=True)
    submit_time = models.DateTimeField(null=True, blank=True)
    total_score = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ('quiz', 'student')

class StudentAnswer(TenantModel):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer = models.TextField(blank=True)
    score = models.FloatField(default=0.0)
