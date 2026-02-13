from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db import transaction, models
from django.http import FileResponse
from .utils import BroadsheetPDFGenerator, ReportCardPDFGenerator


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Write operations restricted to SCHOOL_ADMIN, SUPER_ADMIN, or superusers.
    TEACHER role gets write access too (they need to create scores, attendance etc).
    STUDENT and other roles are read-only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER') or request.user.is_superuser
from .models import (
    Subject, Teacher, Class, Student, 
    ReportCard, SubjectScore, AttendanceSession, AttendanceRecord,
    SchoolEvent, Lesson, ConductEntry,
    Period, Timetable, TimetableEntry, GradingScheme, GradeRange,
    SubjectTeacher, StudentHistory, StudentAchievement
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, ClassSerializer, StudentSerializer,
    ReportCardSerializer, SubjectScoreSerializer, AttendanceSessionSerializer, AttendanceRecordSerializer,
    SchoolEventSerializer, LessonSerializer, ConductEntrySerializer,
    PeriodSerializer, TimetableSerializer, TimetableEntrySerializer, GradingSchemeSerializer, GradeRangeSerializer,
    SubjectTeacherSerializer, StudentHistorySerializer, StudentAchievementSerializer
)
from rest_framework.views import APIView

class HeaderEchoView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({
            "headers": {k: v for k, v in request.headers.items()},
            "tenant_attr": str(getattr(request, 'tenant', 'None')),
            "subdomain_attr": str(getattr(request, 'subdomain', 'None'))
        })
from core.pagination import StandardPagination, LargePagination
from core.cache_utils import CachingMixin

class TenantViewSet(CachingMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

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
        instance = serializer.instance
        user = self.request.user
        # Tenant isolation: verify the object belongs to the user's school
        if not user.is_superuser and hasattr(instance, 'school'):
            user_school = getattr(user, 'school', None) or getattr(self.request, 'tenant', None)
            if user_school and instance.school != user_school:
                raise PermissionDenied('You cannot modify records belonging to another school.')
        super().perform_update(serializer)
        self.invalidate_cache()

    def perform_destroy(self, instance):
        user = self.request.user
        # Tenant isolation: verify the object belongs to the user's school
        if not user.is_superuser and hasattr(instance, 'school'):
            user_school = getattr(user, 'school', None) or getattr(self.request, 'tenant', None)
            if user_school and instance.school != user_school:
                raise PermissionDenied('You cannot delete records belonging to another school.')
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

    @action(detail=True, methods=['get'], url_path='export-broadsheet-pdf')
    def export_broadsheet_pdf(self, request, pk=None):
        """
        Export the master broadsheet for a class as a PDF.
        Query params: session, term
        """
        instance = self.get_object()
        session = request.query_params.get('session')
        term = request.query_params.get('term')

        if not session or not term:
            return Response({"error": "session and term are required query parameters"}, status=400)

        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        
        generator = BroadsheetPDFGenerator(school, instance, session, term)
        pdf_buffer = generator.generate()

        filename = f"Broadsheet_{instance.name.replace(' ', '_')}_{session.replace('/', '-')}_{term.replace(' ', '_')}.pdf"
        return FileResponse(pdf_buffer, as_attachment=True, filename=filename, content_type='application/pdf')

    @action(detail=True, methods=['get'], url_path='bulk-export-report-cards-pdf')
    def bulk_export_report_cards_pdf(self, request, pk=None):
        """
        Export all report cards for a class as a single PDF.
        Query params: session, term
        """
        instance = self.get_object()
        session = request.query_params.get('session')
        term = request.query_params.get('term')

        if not session or not term:
            return Response({"error": "session and term are required query parameters"}, status=400)

        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        
        generator = ReportCardPDFGenerator(school)
        pdf_buffer = generator.generate_bulk(instance, session, term)

        filename = f"Reports_{instance.name.replace(' ', '_')}_{session.replace('/', '-')}_{term.replace(' ', '_')}.pdf"
        return FileResponse(pdf_buffer, as_attachment=True, filename=filename, content_type='application/pdf')

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
        
    @action(detail=False, methods=['post'], url_path='trigger-auto-promotion')
    def trigger_auto_promotion(self, request):
        """
        Trigger the automated promotion task for students who meet the threshold.
        Body: { "session": "2024/2025", "term": "Third Term" }
        """
        session = request.data.get('session')
        term = request.data.get('term')

        if not session or not term:
            return Response({"error": "session and term are required"}, status=400)

        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        if not school:
            return Response({"error": "School context not found"}, status=403)

        from .tasks import promote_students_task
        task = promote_students_task.delay(school.id, session, term)

        return Response({
            "message": "Automated promotion task started.",
            "task_id": task.id
        }, status=202)

class ReportCardViewSet(TenantViewSet):
    queryset = ReportCard.objects.select_related('student', 'student_class', 'school').prefetch_related('scores__subject').all()
    serializer_class = ReportCardSerializer
    pagination_class = StandardPagination

    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        """
        Export a single student report card as a PDF.
        """
        instance = self.get_object()
        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        
        generator = ReportCardPDFGenerator(school)
        pdf_buffer = generator.generate_single(instance)

        filename = f"Report_{instance.student.names.replace(' ', '_')}_{instance.session.replace('/', '-')}.pdf"
        return FileResponse(pdf_buffer, as_attachment=True, filename=filename, content_type='application/pdf')

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

    @action(detail=True, methods=['post'], url_path='suggest-remark')
    def suggest_remark(self, request, pk=None):
        """
        AI-powered remark suggestion based on student scores.
        """
        import os
        report_card = self.get_object()
        scores = report_card.scores.all()
        
        # Simple Logic for now: Summarize performance
        excellent_count = scores.filter(total__gte=80).count()
        average_count = scores.filter(total__lt=80, total__gte=50).count()
        poor_count = scores.filter(total__lt=50).count()
        
        # Structure the data for the AI prompt
        performance_data = {
            "excellent": excellent_count,
            "average": average_count,
            "poor": poor_count,
            "subjects_count": scores.count(),
            "student_name": report_card.student.names
        }
        
        # Placeholder for Gemini integration
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if gemini_api_key:
            # Here we would call the Gemini API
            remark = f"AI Remark for {report_card.student.names} based on {scores.count()} subjects. (Gemini Integrated)"
        else:
            # Fallback heuristic remark
            if excellent_count > (scores.count() / 2):
                remark = f"{report_card.student.names} has shown exceptional performance this term. Keep up the excellent work!"
            elif poor_count > 0:
                remark = f"{report_card.student.names} needs to focus more on certain subjects where performance was below average."
            else:
                remark = f"A good performance overall by {report_card.student.names}. Consistent effort will lead to even better results."
                
        return Response({"suggestion": remark, "data": performance_data})

class StudentHistoryViewSet(TenantViewSet):
    queryset = StudentHistory.objects.all()
    serializer_class = StudentHistorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student__id=student_id)
        return qs

class StudentAchievementViewSet(TenantViewSet):
    queryset = StudentAchievement.objects.all()
    serializer_class = StudentAchievementSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
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

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('class_id')
        date = self.request.query_params.get('date')
        if class_id:
            qs = qs.filter(student_class_id=class_id)
        if date:
            qs = qs.filter(date=date)
        return qs

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


class BroadsheetView(viewsets.ViewSet):
    """
    Broadsheet / Master Result Sheet — aggregates SubjectScores across all subjects
    for a class in a given session and term. Returns a pivoted table.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        if not school:
            return Response({"error": "School context not found"}, status=400)

        class_id = request.query_params.get('class_id')
        session = request.query_params.get('session')
        term = request.query_params.get('term')

        if not all([class_id, session, term]):
            return Response({"error": "class_id, session, and term are required"}, status=400)

        scores = SubjectScore.objects.filter(
            school=school,
            student__current_class_id=class_id,
            session=session,
            term=term
        ).select_related('student', 'subject').order_by('student__names', 'subject__name')

        # Pivot: { student_id: { name, subjects: { subject_name: { ca, exam, total } }, grand_total } }
        broadsheet = {}
        all_subjects = set()

        for score in scores:
            sid = str(score.student_id)
            subject_name = score.subject.name
            all_subjects.add(subject_name)

            if sid not in broadsheet:
                broadsheet[sid] = {
                    'student_id': sid,
                    'student_name': score.student.names if hasattr(score.student, 'names') else str(score.student),
                    'student_no': getattr(score.student, 'student_no', ''),
                    'subjects': {},
                    'grand_total': 0,
                }

            total = float(score.ca_score or 0) + float(score.exam_score or 0)
            broadsheet[sid]['subjects'][subject_name] = {
                'ca': float(score.ca_score or 0),
                'exam': float(score.exam_score or 0),
                'total': total,
                'grade': getattr(score, 'grade', ''),
            }
            broadsheet[sid]['grand_total'] += total

        # Sort students by name and subjects alphabetically
        rows = sorted(broadsheet.values(), key=lambda x: x['student_name'])
        subjects = sorted(all_subjects)

        # Calculate position (rank by grand_total descending)
        sorted_by_total = sorted(rows, key=lambda x: x['grand_total'], reverse=True)
        for idx, row in enumerate(sorted_by_total, 1):
            row['position'] = idx

        return Response({
            'subjects': subjects,
            'students': rows,
            'class_id': class_id,
            'session': session,
            'term': term,
        })

class GlobalSearchView(APIView):
    """
    Search across Students, Staff, and Classes for the current school.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response({"students": [], "staff": [], "classes": []})

        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        # 1. Search Students
        students = Student.objects.filter(
            models.Q(names__icontains=query) | models.Q(student_no__icontains=query),
            school=school
        )[:10]

        # 2. Search Staff (Teachers)
        staff = Teacher.objects.filter(
            models.Q(name__icontains=query) | models.Q(email__icontains=query),
            school=school
        )[:10]

        # 3. Search Classes
        classes = Class.objects.filter(
            name__icontains=query,
            school=school
        )[:10]

        return Response({
            "students": [{"id": s.id, "names": s.names, "student_no": s.student_no, "current_class": s.current_class.name if s.current_class else "N/A"} for s in students],
            "staff": [{"id": s.id, "name": s.name, "staff_type": s.staff_type} for s in staff],
            "classes": [{"id": c.id, "name": c.name} for c in classes]
        })

