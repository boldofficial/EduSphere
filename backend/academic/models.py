from django.db import models
from schools.models import School
from users.models import User

# Abstract base for multi-tenant models
class TenantModel(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="%(class)s_related")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Subject(TenantModel):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"

class Teacher(TenantModel):
    STAFF_TYPES = [
        ('ACADEMIC', 'Academic Staff'),
        ('NON_ACADEMIC', 'Non-Academic Staff'),
    ]
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='teacher_profile')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    passport_url = models.CharField(max_length=512, blank=True, null=True)
    staff_type = models.CharField(max_length=20, choices=STAFF_TYPES, default='ACADEMIC')
    
    # Non-Academic Staff fields
    role = models.CharField(max_length=255, blank=True, null=True, help_text="Job Title (e.g. Bursar)")
    tasks = models.TextField(blank=True, null=True, help_text="Assigned duties")
    assigned_modules = models.JSONField(default=list, blank=True, help_text="List of module IDs they can access")

    def __str__(self):
        return f"{self.name} ({self.school.name}) - {self.staff_type}"

class Class(TenantModel):
    name = models.CharField(max_length=100)
    class_teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name='classes')
    subjects = models.ManyToManyField(Subject, blank=True)

    def __str__(self):
        return f"{self.name} ({self.school.name})"

class SubjectTeacher(TenantModel):
    """
    Explicit mapping for subject teachers per class/session
    This allows a different teacher for Math in JSS1 vs JSS2, or strictly assigning subjects
    """
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='subject_assignments')
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='subject_teachers')
    subject = models.CharField(max_length=100) # Storing name directly as Subject model is loosely coupled
    session = models.CharField(max_length=50)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'teacher']),
            models.Index(fields=['school', 'student_class']),
        ]
        unique_together = ('school', 'teacher', 'student_class', 'subject', 'session')

    def __str__(self):
        return f"{self.teacher.name} - {self.subject} ({self.student_class.name})"

class Student(TenantModel):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_profile')
    student_no = models.CharField(max_length=50) 
    names = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=[('Male','Male'),('Female','Female')])
    current_class = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, related_name='students')
    dob = models.DateField(null=True, blank=True)
    parent_name = models.CharField(max_length=255, blank=True)
    parent_email = models.EmailField(blank=True)
    parent_phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    passport_url = models.CharField(max_length=512, blank=True, null=True)
    
    # Financial Persistence
    assigned_fees = models.JSONField(default=list, blank=True) # List of FeeItem IDs
    discounts = models.JSONField(default=list, blank=True)     # List of discount objects

    def __str__(self):
        return f"{self.names} ({self.school.name})"

    class Meta:
        indexes = [
            models.Index(fields=['school', 'student_no']),
            models.Index(fields=['school', 'current_class']),
            models.Index(fields=['names']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['school', 'student_no'], 
                name='unique_student_no_per_school'
            )
        ]

class GradingScheme(TenantModel):
    name = models.CharField(max_length=100) # e.g., "British Curriculum", "WASSCE Standard"
    is_default = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"

class GradeRange(TenantModel):
    scheme = models.ForeignKey(GradingScheme, related_name='ranges', on_delete=models.CASCADE)
    grade = models.CharField(max_length=10) # e.g., "A", "A+"
    min_score = models.FloatField()         # e.g., 70.0
    max_score = models.FloatField()         # e.g., 100.0
    gpa_point = models.FloatField(default=0.0) 
    remark = models.CharField(max_length=50) # e.g., "Excellent"
    
    class Meta:
        ordering = ['-min_score'] # Highest grades first
        
    def __str__(self):
        return f"{self.grade} ({self.min_score}-{self.max_score})"

class ReportCard(TenantModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='report_cards')
    student_class = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True) 
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50) 
    average = models.FloatField(default=0.0)
    position = models.IntegerField(null=True, blank=True)
    total_score = models.FloatField(default=0.0)
    teacher_remark = models.TextField(blank=True)
    head_teacher_remark = models.TextField(blank=True)
    
    # Enhanced Fields
    affective = models.JSONField(default=dict, blank=True) # e.g. {"Punctuality": 5, "Honesty": 4}
    psychomotor = models.JSONField(default=dict, blank=True) # e.g. {"Sports": 5, "Art": 4}
    attendance_present = models.IntegerField(default=0)
    attendance_total = models.IntegerField(default=0)
    next_term_begins = models.DateField(null=True, blank=True)
    
    # Historical Data Protection
    grading_scheme = models.ForeignKey(GradingScheme, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Publication & Promotion
    is_passed = models.BooleanField(default=False)
    passed_at = models.DateTimeField(null=True, blank=True)
    passed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='passed_reports')
    promoted_to = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='promoted_students')
    
    def __str__(self):
        return f"Report - {self.student.names} - {self.term} {self.session}"

    class Meta:
        indexes = [
            models.Index(fields=['school', 'session', 'term']),
            models.Index(fields=['student', 'session', 'term']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'session', 'term'],
                name='unique_report_per_term'
            )
        ]

    def update_totals(self, save=True):
        scores = self.scores.all()
        if scores.exists():
            total = sum(s.total for s in scores)
            count = scores.count()
            self.total_score = total
            self.average = total / count if count > 0 else 0
        else:
            self.total_score = 0
            self.average = 0
        if save:
            self.save()

    @classmethod
    def calculate_positions(cls, school, student_class, session, term):
        """
        Calculate and update positions for all students in a class for a specific term.
        """
        reports = cls.objects.filter(
            school=school,
            student_class=student_class,
            session=session,
            term=term
        ).order_by('-total_score', '-average')

        if not reports.exists():
            return

        # Simple ranking logic (standard competition ranking)
        current_rank = 1
        for i, report in enumerate(reports):
            if i > 0 and (report.total_score < reports[i-1].total_score):
                current_rank = i + 1
            report.position = current_rank
            report.save(update_fields=['position'])

class SubjectScore(TenantModel):
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='scores')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    ca1 = models.FloatField(default=0)
    ca2 = models.FloatField(default=0)
    exam = models.FloatField(default=0)
    total = models.FloatField(default=0)
    grade = models.CharField(max_length=5, blank=True)
    comment = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        self.total = self.ca1 + self.ca2 + self.exam
        # Simple grading logic (can be expanded)
        if hasattr(self, 'grade') and not self.grade:
            # 1. Try Dynamic Grading Scheme linked to the Report Card
            scheme = self.report_card.grading_scheme
            if scheme:
                grade_range = scheme.ranges.filter(min_score__lte=self.total, max_score__gte=self.total).first()
                if grade_range:
                    self.grade = grade_range.grade
                    self.comment = grade_range.remark
            
            # 2. Fallback to Hardcoded Logic (Legacy/Default)
            if not self.grade:
                if self.total >= 75: self.grade = 'A'
                elif self.total >= 65: self.grade = 'B'
                elif self.total >= 50: self.grade = 'C'
                elif self.total >= 40: self.grade = 'D'
                else: self.grade = 'F'
                
        super().save(*args, **kwargs)
        # Trigger update of parent report card without saving the report card yet 
        # (the serializer will save it once at the end)
        self.report_card.update_totals(save=True) # Still save by default for single updates outside serializer

    def __str__(self):
        return f"{self.subject.name}: {self.total}"

class AttendanceSession(TenantModel):
    date = models.DateField()
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE)
    session = models.CharField(max_length=50)
    term = models.CharField(max_length=50)
    
    def __str__(self):
        return f"Attendance {self.date} - {self.student_class.name}"

    class Meta:
        indexes = [
            models.Index(fields=['school', 'date']),
            models.Index(fields=['student_class', 'date']),
        ]

class AttendanceRecord(TenantModel):
    attendance_session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[('present','Present'),('absent','Absent'),('late','Late')])
    remark = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('attendance_session', 'student')


class SchoolEvent(TenantModel):
    """Calendar events for schools"""
    TYPES = [
        ('academic', 'Academic'),
        ('holiday', 'Holiday'),
        ('exam', 'Examination'),
        ('meeting', 'Meeting'),
        ('other', 'Other'),
    ]
    
    AUDIENCES = [
        ('all', 'All'),
        ('teachers', 'Teachers'),
        ('students', 'Students'),
        ('parents', 'Parents'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    event_type = models.CharField(max_length=20, choices=TYPES, default='academic')
    target_audience = models.CharField(max_length=20, choices=AUDIENCES, default='all')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'start_date']),
            models.Index(fields=['event_type']),
        ]
        ordering = ['start_date']
    
    def __str__(self):
        return f"{self.title} ({self.school.name})"

class Lesson(TenantModel):
    """Learning repository for notes and materials"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lessons')
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='lessons')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    file_url = models.CharField(max_length=512, blank=True, null=True) # URL to PDF/Material
    
    def __str__(self):
        return f"{self.title} - {self.subject.name} ({self.student_class.name})"

class ConductEntry(TenantModel):
    """Log for student behavioral traits over time"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='conduct_entries')
    trait = models.CharField(max_length=100) # e.g. Punctuality, Neatness
    score = models.IntegerField(default=5) # 1-5 scale
    remark = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.student.names} - {self.trait}: {self.score}"

class Period(TenantModel):
    """Defines time slots, e.g., 'Morning Period 1: 8:00-8:40'"""
    name = models.CharField(max_length=50)
    start_time = models.TimeField()
    end_time = models.TimeField()
    category = models.CharField(max_length=50, default='Regular') # Regular, Break, Assembly
    
    def __str__(self):
        return f"{self.name} ({self.start_time}-{self.end_time})"

class Timetable(TenantModel):
    """A master container for a class's schedule"""
    title = models.CharField(max_length=100) # e.g., "JSS1 General Timetable"
    student_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='timetables')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.title} - {self.student_class.name}"

class TimetableEntry(TenantModel):
    """The actual cell: Monday, Period 1, Math, Mr. A"""
    DAYS = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name='entries')
    day_of_week = models.CharField(max_length=20, choices=DAYS)
    period = models.ForeignKey(Period, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True) # Can be different from main subject teacher
    
    class Meta:
        indexes = [
            models.Index(fields=['timetable', 'day_of_week']),
            models.Index(fields=['teacher', 'day_of_week', 'period']), # For conflict checks
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['timetable', 'day_of_week', 'period'], 
                name='unique_class_period_slot'
            ),
            models.UniqueConstraint(
                fields=['teacher', 'day_of_week', 'period'], 
                name='unique_teacher_period_slot'
            )
        ]

    def __str__(self):
        return f"{self.day_of_week} {self.period.name}: {self.subject.name}"
