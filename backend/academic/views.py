from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db import transaction, models
from django.http import FileResponse
from .utils import BroadsheetPDFGenerator, ReportCardPDFGenerator
from .ai_utils import AcademicAI


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
    SubjectTeacher, StudentHistory, StudentAchievement,
    AdmissionIntake, Admission
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, ClassSerializer, StudentSerializer,
    ReportCardSerializer, SubjectScoreSerializer, AttendanceSessionSerializer, AttendanceRecordSerializer,
    SchoolEventSerializer, LessonSerializer, ConductEntrySerializer,
    PeriodSerializer, TimetableSerializer, TimetableEntrySerializer, GradingSchemeSerializer, GradeRangeSerializer,
    SubjectTeacherSerializer, StudentHistorySerializer, StudentAchievementSerializer,
    AdmissionIntakeSerializer, AdmissionSerializer
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
        # Filter based on endpoint, unless 'all' is requested
        if self.request.query_params.get('all') == 'true':
            return qs
            
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
            "name": report_card.student.names,
            "scores": [{"subject": s.subject.name, "score": s.total} for s in scores],
            "conduct": list(ConductEntry.objects.filter(student=report_card.student, session=report_card.session, term=report_card.term).values('category', 'observations', 'points')),
            "attendance": {
                "present": AttendanceRecord.objects.filter(student=report_card.student, session=report_card.session, term=report_card.term, status='PRESENT').count(),
                "absent": AttendanceRecord.objects.filter(student=report_card.student, session=report_card.session, term=report_card.term, status='ABSENT').count()
            }
        }
        
        ai = AcademicAI()
        remark = ai.generate_student_remark(performance_data)
        
        if not remark:
            # Fallback heuristic remark
            excellent_count = scores.filter(total__gte=80).count()
            poor_count = scores.filter(total__lt=50).count()
            
            if excellent_count > (scores.count() / 2):
                remark = f"{report_card.student.names} has shown exceptional performance this term. Keep up the excellent work!"
            elif poor_count > 0:
                remark = f"{report_card.student.names} needs to focus more on certain subjects where performance was below average."
            else:
                remark = f"A good performance overall by {report_card.student.names}. Consistent effort will lead to even better results."
                
        return Response({"suggestion": remark, "data": performance_data})

    @action(detail=False, methods=['post'], url_path='recalculate-positions')
    def recalculate_positions(self, request):
        """
        Recalculate class positions for all students in a given class/session/term.
        Body: { "class_id": "...", "session": "...", "term": "..." }
        """
        class_id = request.data.get('class_id')
        session = request.data.get('session')
        term = request.data.get('term')
        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)

        if not all([class_id, session, term, school]):
            return Response({"error": "class_id, session, and term are required"}, status=400)

        try:
            student_class = Class.objects.get(id=class_id, school=school)
        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=404)

        ReportCard.calculate_positions(school, student_class, session, term)
        count = ReportCard.objects.filter(school=school, student_class=student_class, session=session, term=term).count()
        return Response({"success": True, "message": f"Positions recalculated for {count} students"})


class AIInsightsView(APIView):
    """
    Term-wide insights for admins based on all student data.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('SCHOOL_ADMIN', 'SUPER_ADMIN'):
            raise PermissionDenied("Only administrators can access cross-student AI insights.")
        
        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        session = request.query_params.get('session')
        term = request.query_params.get('term')

        if not session or not term:
            return Response({"error": "Session and term required"}, status=400)

        # Gather summary data
        total_students = Student.objects.filter(school=school, status='active').count()
        report_cards = ReportCard.objects.filter(school=school, session=session, term=term)
        
        at_risk_count = report_cards.filter(average__lt=50).count()
        
        # Simple attendance average
        attendance_records = AttendanceRecord.objects.filter(
            school=school, 
            attendance_session__session=session, 
            attendance_session__term=term
        )
        total_att = attendance_records.count()
        present_att = attendance_records.filter(status__iexact='present').count()
        avg_attendance = (present_att / total_att * 100) if total_att > 0 else 0

        summary_data = {
            "at_risk_count": at_risk_count,
            "average_attendance": round(avg_attendance, 1),
            "top_subjects": ["Mathematics", "English"], # Placeholder for actual trend analysis
            "trends": {
                "average_score": report_cards.aggregate(models.Avg('average'))['average__avg'] or 0
            }
        }

        ai = AcademicAI()
        insights = ai.generate_executive_insights(summary_data)

        return Response({
            "insights": insights,
            "summary": summary_data,
            "term_info": {"session": session, "term": term}
        })

class AITimetableGenerateView(APIView):
    """
    School-wide AI Timetable Generator.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('SCHOOL_ADMIN', 'SUPER_ADMIN'):
            raise PermissionDenied("Only administrators can trigger AI timetable generation.")
        
        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        # Gather Data
        classes_qs = Class.objects.filter(school=school)
        teachers_qs = Teacher.objects.filter(school=school, staff_type='ACADEMIC')
        periods_qs = Period.objects.filter(school=school).order_by('start_time')
        
        school_data = {
            "classes": [],
            "teachers": [],
            "periods": [],
            "days": ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }

        for c in classes_qs:
            class_subjects = []
            for s in c.subjects.all():
                # Defaulting to 4 periods per week
                # We send the real Subject ID as the identifier to simplify saving
                class_subjects.append({
                    "id": str(s.id), 
                    "name": s.name, 
                    "periods_per_week": 4
                })
            school_data["classes"].append({"id": str(c.id), "name": c.name, "subjects": class_subjects})

        for t in teachers_qs:
            # Expertise is inferred from SubjectTeacher if available
            expertise = list(SubjectTeacher.objects.filter(teacher=t).values_list('subject', flat=True).distinct())
            school_data["teachers"].append({"id": str(t.id), "name": t.name, "expertise": expertise})

        for p in periods_qs:
            school_data["periods"].append({"id": str(p.id), "name": p.name, "category": p.category})

        ai = AcademicAI()
        try:
            entries = ai.generate_timetable(school_data)
        except Exception as e:
            logger.error(f"AI Timetable unexpected crash: {str(e)}")
            return Response({"error": f"Internal AI Error: {str(e)}"}, status=500)

        if not entries:
            # Check if it was a parsing error or a model configuration issue
            if ai.model is None:
                return Response({"error": "AI model not configured. Please check your API keys in Platform Settings."}, status=500)
            return Response({"error": "AI failed to generate a valid timetable. This usually happens when teacher expertise is not set up correctly."}, status=500)

        # process and save entries
        with transaction.atomic():
            for entry_data in entries:
                try:
                    # Validate class and school context
                    c = Class.objects.get(id=entry_data['class_id'], school=school)
                    
                    # Get or Create Timetable for class
                    timetable, _ = Timetable.objects.get_or_create(
                        student_class=c, 
                        school=school,
                        defaults={'title': f'{c.name} Weekly Schedule', 'is_active': True}
                    )
                    
                    # Wipe existing entries for this slot to avoid UniqueConstraint errors
                    TimetableEntry.objects.filter(
                        timetable=timetable,
                        day_of_week=entry_data['day'],
                        period_id=entry_data['period_id']
                    ).delete()

                    # Save new entry
                    teacher_id = entry_data.get('teacher_id')
                    if not teacher_id: teacher_id = None
                    
                    TimetableEntry.objects.create(
                        school=school,
                        timetable=timetable,
                        day_of_week=entry_data['day'],
                        period_id=entry_data['period_id'],
                        subject_id=entry_data['subject_id'],
                        teacher_id=teacher_id
                    )
                except Exception as e:
                    logger.error(f"Error saving AI Timetable Entry: {str(e)}")
                    continue 


class AdmissionIntakeViewSet(TenantViewSet):
    queryset = AdmissionIntake.objects.all()
    serializer_class = AdmissionIntakeSerializer
    pagination_class = StandardPagination

class AdmissionViewSet(TenantViewSet):
    queryset = Admission.objects.select_related('intake', 'school').all()
    serializer_class = AdmissionSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        """
        Allow public access for submitting applications (create).
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        intake_id = self.request.query_params.get('intake')
        if status:
            qs = qs.filter(status=status)
        if intake_id:
            qs = qs.filter(intake_id=intake_id)
        return qs

    @action(detail=True, methods=['post'], url_path='convert-to-student')
    def convert_to_student(self, request, pk=None):
        from django.utils import timezone
        admission = self.get_object()
        student_no = request.data.get('student_no')
        class_id = request.data.get('class_id')
        password = request.data.get('password', 'merit_student_2025')

        if not student_no or not class_id:
            return Response({"error": "student_no and class_id are required"}, status=400)

        with transaction.atomic():
            # 1. Update Admission status
            admission.status = 'accepted'
            admission.reviewed_at = timezone.now()
            admission.reviewed_by = request.user
            admission.save()

            # 2. Create Student
            from .models import Student, Class
            try:
                target_class = Class.objects.get(pk=class_id)
            except Class.DoesNotExist:
                return Response({"error": "Class not found"}, status=404)
            
            student = Student.objects.create(
                school=admission.school,
                student_no=student_no,
                names=admission.child_name,
                gender=admission.child_gender,
                dob=admission.child_dob,
                current_class=target_class,
                parent_name=admission.parent_name,
                parent_email=admission.parent_email,
                parent_phone=admission.parent_phone,
                address=admission.parent_address,
                status='active'
            )

            # 3. Create User for portal access
            from users.models import User
            from django.contrib.auth.hashers import make_password
            school_suffix = student.school.domain if student.school and student.school.domain else 'school'
            username = f"{student.student_no}@{school_suffix}"
            
            if not User.objects.filter(username=username).exists():
                user = User.objects.create(
                    username=username,
                    email=student.parent_email or f"{username}.com",
                    password=make_password(password),
                    role='STUDENT',
                    school=student.school,
                    is_active=True
                )
                student.user = user
                student.save()

            # 4. Handle Fees from AdmissionPackage (Fee Bundling)
            if admission.intake:
                try:
                    from bursary.models import AdmissionPackage, StudentFee
                    package = AdmissionPackage.objects.get(intake=admission.intake)
                    for fee in package.fees.all():
                        StudentFee.objects.get_or_create(
                            student=student,
                            fee_item=fee,
                            school=student.school
                        )
                except (ImportError, AdmissionPackage.DoesNotExist):
                    # bursary app might not be installed or package not found
                    pass

            return Response({
                "success": True, 
                "message": "Admission successfully converted to student with automated fee assignment.",
                "student_id": student.id
            })

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student=user.student_profile)
        return qs

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student=user.student_profile)
        return qs

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student_class=user.student_profile.current_class)
        return qs

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student=user.student_profile)
        return qs

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

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student_class=user.student_profile.current_class)
        return qs

class TimetableEntryViewSet(TenantViewSet):
    queryset = TimetableEntry.objects.select_related('timetable', 'period', 'subject', 'teacher', 'school').all()
    serializer_class = TimetableEntrySerializer
    pagination_class = LargePagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(timetable__student_class=user.student_profile.current_class)
        return qs

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


class AIPredictiveInsightsView(APIView):
    """
    AI-powered predictive analytics for student performance.
    GET /academic/predictive-insights/?class_id=X&session=Y&term=Z
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = getattr(request.user, 'school', None) or getattr(request, 'tenant', None)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        class_id = request.query_params.get('class_id')
        session = request.query_params.get('session', '')
        term = request.query_params.get('term', '')

        if not class_id:
            return Response({"error": "class_id is required"}, status=400)

        try:
            student_class = Class.objects.get(id=class_id, school=school)
        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=404)

        students = Student.objects.filter(school=school, current_class=student_class, status='active')
        
        ai = AcademicAI()
        predictions = []

        for student in students:
            # 1. Get current term report card and scores
            report = ReportCard.objects.filter(
                student=student, session=session, term=term, school=school
            ).prefetch_related('scores__subject').first()
            
            scores_data = []
            current_avg = 0
            if report:
                current_avg = report.average
                for score in report.scores.all():
                    scores_data.append({
                        "subject": score.subject.name,
                        "ca1": score.ca1, "ca2": score.ca2,
                        "exam": score.exam, "total": score.total,
                        "grade": score.grade,
                    })

            # 2. Get attendance rate
            total_sessions = AttendanceSession.objects.filter(
                student_class=student_class, school=school, session=session, term=term
            ).count()
            present_count = AttendanceRecord.objects.filter(
                attendance_session__student_class=student_class,
                attendance_session__school=school,
                attendance_session__session=session,
                attendance_session__term=term,
                student=student,
                status='present'
            ).count()
            attendance_rate = (present_count / total_sessions * 100) if total_sessions > 0 else 100

            # 3. Get conduct scores
            conduct_entries = ConductEntry.objects.filter(student=student, school=school).order_by('-date')[:10]
            conduct_data = [{"trait": c.trait, "score": c.score} for c in conduct_entries]

            # 4. Get historical averages (past terms for this student)
            past_reports = ReportCard.objects.filter(
                student=student, school=school
            ).exclude(
                session=session, term=term
            ).order_by('session', 'term').values_list('average', flat=True)[:6]
            historical_avgs = list(past_reports)

            # 5. Call AI prediction
            student_payload = {
                "name": student.names,
                "class_name": student_class.name,
                "scores": scores_data,
                "average": current_avg,
                "attendance_rate": round(attendance_rate, 1),
                "conduct_scores": conduct_data,
                "historical_averages": historical_avgs,
            }

            prediction = ai.predict_student_performance(student_payload)

            predictions.append({
                "student_id": student.id,
                "student_name": student.names,
                "student_no": student.student_no,
                "current_average": current_avg,
                "attendance_rate": round(attendance_rate, 1),
                "prediction": prediction or {
                    "risk_level": "medium" if current_avg < 50 else "low",
                    "predicted_average": current_avg,
                    "confidence": 0.5,
                    "key_concerns": [],
                    "strengths": [],
                    "recommendations": ["Insufficient data for detailed prediction."],
                }
            })

        # Summary counts
        high_risk = sum(1 for p in predictions if p['prediction'].get('risk_level') == 'high')
        medium_risk = sum(1 for p in predictions if p['prediction'].get('risk_level') == 'medium')
        low_risk = sum(1 for p in predictions if p['prediction'].get('risk_level') == 'low')

        return Response({
            "class_name": student_class.name,
            "session": session,
            "term": term,
            "summary": {
                "total_students": len(predictions),
                "high_risk": high_risk,
                "medium_risk": medium_risk,
                "low_risk": low_risk,
            },
            "predictions": predictions,
        })


class AILessonPlanView(APIView):
    """
    AI-powered lesson plan generation.
    POST /academic/ai-lesson-plan/
    Body: { subject, class_name, topic, duration_minutes, objectives?, notes? }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'):
            raise PermissionDenied("Only staff members can generate AI lesson plans.")
        
        subject = request.data.get('subject')
        class_name = request.data.get('class_name')
        topic = request.data.get('topic')
        duration = request.data.get('duration_minutes', 45)

        if not all([subject, class_name, topic]):
            return Response({"error": "subject, class_name, and topic are required."}, status=400)

        ai = AcademicAI()
        plan = ai.generate_lesson_plan({
            "subject": subject,
            "class_name": class_name,
            "topic": topic,
            "duration_minutes": duration,
            "objectives": request.data.get('objectives', ''),
            "notes": request.data.get('notes', ''),
        })

        if plan:
            return Response({"plan": plan, "message": "Lesson plan generated successfully."})
        else:
            return Response({"error": "AI lesson plan generation failed. Check your API key."}, status=500)
