from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import (
    Subject, Teacher, Class, Student, 
    ReportCard, SubjectScore, AttendanceSession, AttendanceRecord,
    SchoolEvent, Lesson, ConductEntry
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, ClassSerializer, StudentSerializer,
    ReportCardSerializer, SubjectScoreSerializer, AttendanceSessionSerializer, AttendanceRecordSerializer,
    SchoolEventSerializer, LessonSerializer, ConductEntrySerializer
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
