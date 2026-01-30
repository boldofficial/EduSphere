from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from .models import (
    Subject, Teacher, Class, Student, 
    ReportCard, SubjectScore, AttendanceSession, AttendanceRecord,
    SchoolEvent, Lesson, ConductEntry,
    Period, Timetable, TimetableEntry, GradingScheme, GradeRange,
    SubjectTeacher
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, ClassSerializer, StudentSerializer,
    ReportCardSerializer, SubjectScoreSerializer, AttendanceSessionSerializer, AttendanceRecordSerializer,
    SchoolEventSerializer, LessonSerializer, ConductEntrySerializer,
    PeriodSerializer, TimetableSerializer, TimetableEntrySerializer, GradingSchemeSerializer, GradeRangeSerializer,
    SubjectTeacherSerializer
)
from core.pagination import StandardPagination, LargePagination
from core.cache_utils import CachingMixin

class TenantViewSet(CachingMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        
        if user.is_superuser:
            return self.queryset.all()
        
        if hasattr(user, 'school') and user.school:
            return self.queryset.filter(school=user.school)
        
        # Fallback to tenant context from headers/middleware
        tenant_school = getattr(self.request, 'tenant', None)
        if tenant_school:
            return self.queryset.filter(school=tenant_school)

        return self.queryset.none()

    def perform_create(self, serializer):
        user_school = getattr(self.request.user, 'school', None)
        tenant_school = getattr(self.request, 'tenant', None)
        
        if user_school:
            serializer.save(school=user_school)
        elif tenant_school:
            serializer.save(school=tenant_school)
        else:
             if self.request.user.is_superuser:
                 serializer.save()
        self.invalidate_cache()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        self.invalidate_cache()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        self.invalidate_cache()

class SubjectViewSet(TenantViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    pagination_class = StandardPagination

class TeacherViewSet(TenantViewSet):
    queryset = Teacher.objects.select_related('user', 'school').all()
    serializer_class = TeacherSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter based on endpoint
        if 'staff' in self.request.path:
            return qs.filter(staff_type='NON_ACADEMIC')
        return qs.filter(staff_type='ACADEMIC')

    def perform_create(self, serializer):
        # Determine staff_type from path
        staff_type = 'NON_ACADEMIC' if 'staff' in self.request.path else 'ACADEMIC'
        
        user_school = getattr(self.request.user, 'school', None)
        tenant_school = getattr(self.request, 'tenant', None)
        school = user_school or tenant_school

        serializer.save(school=school, staff_type=staff_type)
        self.invalidate_cache()

class ClassViewSet(TenantViewSet):
    queryset = Class.objects.select_related('class_teacher', 'school').prefetch_related('subjects').all()
    serializer_class = ClassSerializer
    pagination_class = StandardPagination

class StudentViewSet(TenantViewSet):
    queryset = Student.objects.select_related('user', 'current_class', 'school').all()
    serializer_class = StudentSerializer
    pagination_class = LargePagination

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('class')
        search = self.request.query_params.get('search')

        if class_id:
            qs = qs.filter(current_class_id=class_id)
        if search:
            qs = qs.filter(
                models.Q(names__icontains=search) | 
                models.Q(student_no__icontains=search)
            )
        return qs

    @action(detail=False, methods=['post'], url_path='bulk-promote')
    def bulk_promote(self, request):
        """
        Promote or repeat multiple students at once.
        Body: { "promotions": { "student_id": "next_class_id", ... } }
        """
        promotions = request.data.get('promotions', {})
        if not promotions:
            return Response({"error": "No promotions provided"}, status=400)
        
        updated_count = 0
        with transaction.atomic():
            for student_id, next_class_id in promotions.items():
                try:
                    student = Student.objects.get(pk=student_id)
                    # Check tenant isolation if not superuser
                    if not request.user.is_superuser and student.school != request.user.school:
                        continue
                    
                    if next_class_id == 'graduate':
                        # Handle graduation logic if needed (e.g. set class to null and status to graduated)
                        student.current_class = None
                        # student.is_active = False # or similar
                    else:
                        target_class = Class.objects.get(pk=next_class_id)
                        student.current_class = target_class
                    
                    student.save()
                    updated_count += 1
                except (Student.DoesNotExist, Class.DoesNotExist):
                    continue
        
        return Response({"message": f"Successfully processed {updated_count} students"})

class ReportCardViewSet(TenantViewSet):
    queryset = ReportCard.objects.select_related('student', 'student_class', 'school').prefetch_related('scores__subject').all()
    serializer_class = ReportCardSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # 1. Security: Restrict Students/Parents to their own records
        if user.role == 'STUDENT':
            qs = qs.filter(student__user=user)
        elif user.role == 'PARENT':
            # Assuming Parent is linked to Student via email/phone or explicit link
            # For now, filtering by parent_email match if simple link
            qs = qs.filter(student__parent_email=user.email)
        
        # 2. Filters for "Past Report Cards" feature
        session = self.request.query_params.get('session')
        term = self.request.query_params.get('term')
        student_id = self.request.query_params.get('student')

        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        if student_id:
             qs = qs.filter(student__id=student_id)
             
        return qs

class SubjectScoreViewSet(TenantViewSet):
    queryset = SubjectScore.objects.select_related('student', 'subject', 'school').all()
    serializer_class = SubjectScoreSerializer
    pagination_class = StandardPagination

class AttendanceSessionViewSet(TenantViewSet):
    queryset = AttendanceSession.objects.select_related('student_class', 'school').all()
    serializer_class = AttendanceSessionSerializer
    pagination_class = StandardPagination

class AttendanceRecordViewSet(TenantViewSet):
    queryset = AttendanceRecord.objects.select_related('attendance_session', 'student', 'school').all()
    serializer_class = AttendanceRecordSerializer
    pagination_class = LargePagination

class SchoolEventViewSet(TenantViewSet):
    queryset = SchoolEvent.objects.select_related('created_by', 'school').all()
    serializer_class = SchoolEventSerializer
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(school=self.request.user.school, created_by=self.request.user)
        else:
            if self.request.user.is_superuser:
                serializer.save(created_by=self.request.user)

class LessonViewSet(TenantViewSet):
    queryset = Lesson.objects.select_related('subject', 'student_class', 'teacher', 'school').all()
    serializer_class = LessonSerializer
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        # Assign teacher profile automatically if current user is a teacher
        teacher = None
        if hasattr(self.request.user, 'teacher_profile'):
            teacher = self.request.user.teacher_profile
        
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(school=self.request.user.school, teacher=teacher)
        else:
            serializer.save(teacher=teacher)

class ConductEntryViewSet(TenantViewSet):
    queryset = ConductEntry.objects.select_related('student', 'recorded_by', 'school').all()
    serializer_class = ConductEntrySerializer
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(school=self.request.user.school, recorded_by=self.request.user)
        else:
            serializer.save(recorded_by=self.request.user)

class PeriodViewSet(TenantViewSet):
    queryset = Period.objects.select_related('school').all()
    serializer_class = PeriodSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=['post'], url_path='setup-defaults')
    def setup_defaults(self, request):
        """
        Creates a standard set of periods for the school.
        """
        user_school = getattr(request.user, 'school', None)
        tenant_school = getattr(request, 'tenant', None)
        school = user_school or tenant_school

        if not school:
            return Response({"error": "School context not found"}, status=400)

        if Period.objects.filter(school=school).exists():
            return Response({"message": "Periods already exist for this school"}, status=200)

        # Standard Nigerian School Day (approx)
        default_periods = [
            ("Assembly", "08:00:00", "08:15:00", "Assembly"),
            ("Period 1", "08:15:00", "08:55:00", "Regular"),
            ("Period 2", "08:55:00", "09:35:00", "Regular"),
            ("Period 3", "09:35:00", "10:15:00", "Regular"),
            ("Short Break", "10:15:00", "10:30:00", "Break"),
            ("Period 4", "10:30:00", "11:10:00", "Regular"),
            ("Period 5", "11:10:00", "11:50:00", "Regular"),
            ("Long Break", "11:50:00", "12:30:00", "Break"),
            ("Period 6", "12:30:00", "13:10:00", "Regular"),
            ("Period 7", "13:10:00", "13:50:00", "Regular"),
            ("Period 8", "13:50:00", "14:30:00", "Regular"),
        ]

        created_periods = []
        with transaction.atomic():
            for name, start, end, cat in default_periods:
                p = Period.objects.create(
                    school=school,
                    name=name,
                    start_time=start,
                    end_time=end,
                    category=cat
                )
                created_periods.append(p.id)

        self.invalidate_cache()
        return Response({
            "message": f"Successfully created {len(created_periods)} default periods",
            "period_ids": created_periods
        }, status=201)

class TimetableViewSet(TenantViewSet):
    queryset = Timetable.objects.select_related('student_class', 'school').prefetch_related('entries__subject', 'entries__teacher').all()
    serializer_class = TimetableSerializer
    pagination_class = StandardPagination

class TimetableEntryViewSet(TenantViewSet):
    queryset = TimetableEntry.objects.select_related('timetable', 'period', 'subject', 'teacher', 'school').all()
    serializer_class = TimetableEntrySerializer
    pagination_class = LargePagination

class GradingSchemeViewSet(TenantViewSet):
    queryset = GradingScheme.objects.select_related('school').prefetch_related('ranges').all()
    serializer_class = GradingSchemeSerializer
    pagination_class = StandardPagination

class GradeRangeViewSet(TenantViewSet):
    queryset = GradeRange.objects.select_related('scheme', 'school').all()
    serializer_class = GradeRangeSerializer
    pagination_class = StandardPagination

class SubjectTeacherViewSet(TenantViewSet):
    queryset = SubjectTeacher.objects.select_related('teacher', 'student_class', 'school').all()
    serializer_class = SubjectTeacherSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by teacher if user is a teacher
        if self.request.user.role == 'TEACHER' and hasattr(self.request.user, 'teacher_profile'):
            qs = qs.filter(teacher=self.request.user.teacher_profile)
            
        # Optional filters
        class_id = self.request.query_params.get('class_id')
        teacher_id = self.request.query_params.get('teacher_id')
        session = self.request.query_params.get('session')
        
        if class_id:
            qs = qs.filter(student_class_id=class_id)
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if session:
            qs = qs.filter(session=session)
            
        return qs
