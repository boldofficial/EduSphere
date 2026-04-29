from django.db import models

from academic.models import Class, Student, Subject, Teacher, TenantModel


class Assignment(TenantModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="assignments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="assignments")
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name="assignments")
    due_date = models.DateTimeField()
    points = models.IntegerField(default=100)
    attachment_url = models.CharField(max_length=512, blank=True, null=True)  # Legacy/General attachment
    video_url = models.URLField(max_length=512, blank=True, null=True)
    image_url = models.URLField(max_length=512, blank=True, null=True)

    def __str__(self):
        return f"{self.title} - {self.student_class.name}"


class Submission(TenantModel):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="submissions")
    submission_text = models.TextField(blank=True)
    submission_file = models.CharField(max_length=512, blank=True, null=True)
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("assignment", "student")

    def __str__(self):
        return f"Submission: {self.student.names} - {self.assignment.title}"


# ==========================================
# CBT (Computer Based Testing)
# ==========================================


class Quiz(TenantModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="quizzes")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="quizzes")
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name="quizzes")
    duration_minutes = models.IntegerField(default=60)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return f"Quiz: {self.title} ({self.student_class.name})"


class Question(TenantModel):
    TYPE_CHOICES = (
        ("mcq", "Multiple Choice"),
        ("theory", "Theory"),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="mcq")
    points = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.quiz.title} - Q: {self.text[:50]}"


class Option(TenantModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.text} ({'Correct' if self.is_correct else 'Wrong'})"


class Attempt(TenantModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="quiz_attempts")
    start_time = models.DateTimeField(auto_now_add=True)
    submit_time = models.DateTimeField(null=True, blank=True)
    total_score = models.FloatField(default=0.0)

    @property
    def violation_count(self):
        return self.violations.count()

    @property
    def is_violated(self):
        return self.violations.filter(auto_submitted=True).exists()

    class Meta:
        unique_together = ("quiz", "student")


class StudentAnswer(TenantModel):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(Option, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer = models.TextField(blank=True)
    score = models.FloatField(default=0.0)


class ExamViolation(TenantModel):
    attempt = models.ForeignKey(Attempt, related_name="violations", on_delete=models.CASCADE)
    count = models.PositiveIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    auto_submitted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Violation (Count: {self.count}) for {self.attempt}"


# ==========================================
# QUESTION BANK
# ==========================================


class QuestionBank(TenantModel):
    """Reusable question repository per subject/class."""
    
    name = models.CharField(max_length=255)
    subject = models.ForeignKey("academic.Subject", on_delete=models.CASCADE, related_name="question_banks")
    description = models.TextField(blank=True)
    created_by = models.ForeignKey("academic.Teacher", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_banks")
    
    class Meta:
        unique_together = ("school", "name", "subject")
    
    def __str__(self):
        return f"{self.name} - {self.subject.name}"


class BankQuestion(TenantModel):
    """Individual questions in the question bank."""
    
    TYPE_CHOICES = (
        ("mcq", "Multiple Choice"),
        ("true_false", "True/False"),
        ("fill_blank", "Fill in the Blank"),
        ("theory", "Theory/Essay"),
    )
    DIFFICULTY_CHOICES = (
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    )
    
    bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="mcq")
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    points = models.IntegerField(default=1)
    explanation = models.TextField(blank=True, help_text="Answer explanation for students")
    topic = models.CharField(max_length=100, blank=True, help_text="Topic/chapter this question belongs to")
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.question_text[:50]}... ({self.bank.name})"


class BankOption(TenantModel):
    """Answer options for MCQ/True-False questions in bank."""
    
    question = models.ForeignKey(BankQuestion, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ["order", "id"]
    
    def __str__(self):
        return f"{self.text[:30]}... ({'✓' if self.is_correct else '✗'})"


class FillBlankAnswer(TenantModel):
    """Accepted answers for fill-in-the-blank questions."""
    
    question = models.ForeignKey(BankQuestion, on_delete=models.CASCADE, related_name="accepted_answers")
    answer = models.CharField(max_length=500)
    is_exact = models.BooleanField(default=True, help_text="If false, uses partial matching")
    
    def __str__(self):
        return f"{self.answer} ({self.question.question_text[:20]}...)"


# ==========================================
# FORMAL EXAMS (Written Examinations)
# ==========================================


class Exam(TenantModel):
    """Formal written examination."""
    
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    subject = models.ForeignKey("academic.Subject", on_delete=models.CASCADE, related_name="exams")
    student_class = models.ForeignKey("academic.Class", on_delete=models.CASCADE, related_name="exams")
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)
    
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField(default=60)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    total_marks = models.FloatField(default=100)
    passing_marks = models.FloatField(default=40)
    
    instructions = models.TextField(blank=True)
    created_by = models.ForeignKey("academic.Teacher", on_delete=models.SET_NULL, null=True, related_name="created_exams")
    
    # Grading
    grading_scheme = models.ForeignKey("academic.GradingScheme", on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-exam_date", "-created_at"]
        indexes = [
            models.Index(fields=["school", "session", "term"]),
            models.Index(fields=["student_class", "subject"]),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.subject.name} ({self.student_class.name})"


class ExamPaper(TenantModel):
    """Exam paper/script with questions for students to answer."""
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="papers")
    student = models.ForeignKey("academic.Student", on_delete=models.CASCADE, related_name="exam_papers")
    
    # Status
    STATUS_CHOICES = (
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("submitted", "Submitted"),
        ("graded", "Graded"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Grading
    total_score = models.FloatField(default=0.0)
    percentage = models.FloatField(default=0.0)
    grade = models.CharField(max_length=10, blank=True)
    remark = models.TextField(blank=True)
    
    # Room locking
    ip_address = models.CharField(max_length=50, blank=True)
    is_locked = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ("exam", "student")
        ordering = ["student__names"]
    
    def __str__(self):
        return f"{self.exam.title} - {self.student.names}"


class ExamQuestion(TenantModel):
    """Questions in an exam paper (copied/mapped from QuestionBank or created directly)."""
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="exam_questions")
    question_text = models.TextField()
    question_number = models.IntegerField()
    
    QUESTION_TYPE_CHOICES = (
        ("mcq", "Multiple Choice"),
        ("true_false", "True/False"),
        ("fill_blank", "Fill in the Blank"),
        ("short", "Short Answer"),
        ("long", "Long Essay"),
    )
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default="short")
    
    marks = models.FloatField(default=1.0)
    options = models.JSONField(default=list, blank=True, help_text="For MCQ: [{text, is_correct}]")
    model_answer = models.TextField(blank=True, help_text="Expected answer for grading")
    
    class Meta:
        ordering = ["question_number"]
    
    def __str__(self):
        return f"Q{self.question_number}: {self.question_text[:30]}..."


class ExamAnswer(TenantModel):
    """Student's answer to an exam question."""
    
    paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(ExamQuestion, on_delete=models.CASCADE)
    
    text_answer = models.TextField(blank=True)
    selected_option = models.IntegerField(null=True, blank=True, help_text="Index of selected option for MCQ")
    
    # Grading
    marks_obtained = models.FloatField(default=0.0)
    is_graded = models.BooleanField(default=False)
    graded_by = models.ForeignKey("academic.Teacher", on_delete=models.SET_NULL, null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    
    class Meta:
        unique_together = ("paper", "question")
    
    def __str__(self):
        return f"{self.paper.student.names} - Q{self.question.question_number}"


class ExamRoom(TenantModel):
    """Virtual exam room to lock students during exam."""
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="exam_rooms")
    student = models.ForeignKey("academic.Student", on_delete=models.CASCADE, related_name="exam_rooms")
    
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    unlock_code = models.CharField(max_length=10, blank=True)
    violations = models.PositiveIntegerField(default=0)
    
    # Browser/connection tracking
    ip_address = models.CharField(max_length=50, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        unique_together = ("exam", "student")
    
    def __str__(self):
        return f"Room: {self.exam.title} - {self.student.names} ({'LOCKED' if self.is_locked else 'OPEN'})"
