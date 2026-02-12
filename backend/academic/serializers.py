from django.db import transaction, models
import logging

logger = logging.getLogger(__name__)
from rest_framework import serializers
from users.models import User
from .models import (
    Subject, Teacher, Class, Student, 
    ReportCard, SubjectScore, AttendanceSession, AttendanceRecord,
    SchoolEvent, Lesson, ConductEntry,
    Period, Timetable, TimetableEntry, GradingScheme, GradeRange,
    SubjectTeacher
)

class Base64ImageField(serializers.CharField):
    """
    Custom field to handle base64 encoded images.
    Saves to storage and returns the URL.
    """
    def to_internal_value(self, data):
        if data and isinstance(data, str) and data.startswith('data:image'):
            try:
                # Format: "data:image/png;base64,iVBORw0KG..."
                header, imgstr = data.split(';base64,') 
                ext = header.split('/')[-1] 
                
                import uuid
                import base64
                import datetime
                from django.core.files.base import ContentFile
                from django.core.files.storage import default_storage
                
                filename = f"passports/{uuid.uuid4()}.{ext}"
                decoded_file = base64.b64decode(imgstr)
                
                file_name = default_storage.save(filename, ContentFile(decoded_file))
                
                # Store ONLY the relative path in DB
                return file_name
            except Exception as e:
                import traceback
                logger.error(f"Base64 Image Upload Failed: {e}")
                return data
        
        # If it's already a path or full URL, return as is (avoiding re-upload)
        if data and isinstance(data, str) and (data.startswith('http') or '/' in data):
             # Extract path if it contains 'passports' to maintain consistency
             if 'passports' in data:
                 parts = data.split('?')[0].split('/')
                 idx = parts.index('passports')
                 return "/".join(parts[idx:])
             return data
                 
        return super().to_internal_value(data)

class GradeRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeRange
        fields = ['grade', 'min_score', 'max_score', 'remark', 'gpa_point']
        read_only_fields = ('school',)

class GradingSchemeSerializer(serializers.ModelSerializer):
    ranges = GradeRangeSerializer(many=True, read_only=True)
    class Meta:
        model = GradingScheme
        fields = ['id', 'name', 'is_default', 'description', 'ranges']
        read_only_fields = ('school',)

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'
        read_only_fields = ('school',)

class TeacherSerializer(serializers.ModelSerializer):
    passport_url = Base64ImageField(required=False, allow_null=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        required=False, 
        allow_null=True
    )
    
    class Meta:
        model = Teacher
        fields = ['id', 'user', 'school', 'name', 'address', 'phone', 'email', 'passport_url', 'staff_type', 'role', 'tasks', 'assigned_modules', 'created_at', 'updated_at']
        read_only_fields = ('school',)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url
        if instance.passport_url:
            ret['passport_url'] = get_media_url(instance.passport_url)
        return ret

class ClassSerializer(serializers.ModelSerializer):
    class_teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), 
        source='class_teacher', 
        required=False, 
        allow_null=True
    )
    # Use a separate field for input to avoid iteration conflicts during super().to_representation
    subjects_input = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Class
        fields = ['id', 'name', 'class_teacher', 'class_teacher_id', 'subjects_input', 'created_at', 'updated_at']
        read_only_fields = ('id', 'school', 'class_teacher')

    def to_internal_value(self, data):
        # Map frontend 'subjects' to 'subjects_input'
        if 'subjects' in data and data['subjects'] is not None:
            data = data.copy()
            data['subjects_input'] = data.pop('subjects')
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Explicitly add subjects as list of names for the frontend
        ret['subjects'] = [s.name for s in instance.subjects.all()]
        return ret

    def create(self, validated_data):
        subjects_names = validated_data.pop('subjects_input', [])
        school = validated_data.get('school')
        
        instance = super().create(validated_data)
        
        if subjects_names:
            subject_objs = []
            for name in subjects_names:
                sub, _ = Subject.objects.get_or_create(name=name, school=school)
                subject_objs.append(sub)
            instance.subjects.set(subject_objs)
        
        return instance

    def update(self, instance, validated_data):
        subjects_names = validated_data.pop('subjects_input', None)
        school = instance.school
        
        instance = super().update(instance, validated_data)
        
        if subjects_names is not None:
            subject_objs = []
            for name in subjects_names:
                sub, _ = Subject.objects.get_or_create(name=name, school=school)
                subject_objs.append(sub)
            instance.subjects.set(subject_objs)
            
        return instance

class StudentSerializer(serializers.ModelSerializer):
    class_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)
    
    passport_url = Base64ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_no', 'names', 'gender', 'current_class', 'class_id',
            'dob', 'parent_name', 'parent_email', 'parent_phone', 'address',
            'passport_url', 'assigned_fees', 'discounts', 'password',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('school', 'user', 'current_class')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Force class_id to be an integer (native ID type) to match frontend expectation
        ret['class_id'] = instance.current_class.id if instance.current_class else None
        
        from core.media_utils import get_media_url
        if instance.passport_url:
            ret['passport_url'] = get_media_url(instance.passport_url)
        return ret

    def to_internal_value(self, data):
        data = data.copy()
        # Handle empty strings for optional fields
        if data.get('dob') == '':
            data['dob'] = None
            
        return super().to_internal_value(data)

    def create(self, validated_data):
        from users.models import User
        from django.contrib.auth.hashers import make_password
        
        class_id = validated_data.pop('class_id', None)
        password = validated_data.pop('password', None)
        school = validated_data.get('school', None)
        
        # Resolve class
        if class_id:
            try:
                validated_data['current_class'] = Class.objects.get(id=class_id)
            except Class.DoesNotExist:
                pass
                
        instance = super().create(validated_data)
        
        if password and instance.student_no:
            # Generate scoped username to prevent collisions across tenants
            # Format: ST001@vine-heritage
            school_suffix = instance.school.domain if instance.school and instance.school.domain else 'school'
            username = f"{instance.student_no}@{school_suffix}"
            email = instance.parent_email or f"{username}.com" # distinct from real emails
            
            # Check if user exists (should not exist with this scoped username)
            if not User.objects.filter(username=username).exists():
                user = User.objects.create(
                    username=username,
                    email=email,
                    password=make_password(password),
                    role='STUDENT',
                    school=instance.school,
                    is_active=True
                )
                instance.user = user
                instance.save()
            else:
                # If user exists (e.g. re-enrolling), just link it
                user = User.objects.get(username=username)
                user.password = make_password(password) # Update password
                user.save()
                instance.user = user
                instance.save()
                
        return instance

    def update(self, instance, validated_data):
        try:
            from users.models import User
            from django.contrib.auth.hashers import make_password
            
            class_id = validated_data.pop('class_id', None)
            password = validated_data.pop('password', None)
            
            if class_id:
                try:
                    validated_data['current_class'] = Class.objects.get(id=class_id)
                except Class.DoesNotExist:
                    pass
                    
            instance = super().update(instance, validated_data)
            
            # Update password if provided
            if password and instance.user:
                instance.user.password = make_password(password)
                instance.user.save()
            elif password and not instance.user:
                 # Create user if it doesn't exist during update
                 school_suffix = instance.school.domain if instance.school and instance.school.domain else 'school'
                 username = f"{instance.student_no}@{school_suffix}"
                 email = instance.parent_email or f"{username}.com"
                 
                 if not User.objects.filter(username=username).exists():
                    user = User.objects.create(
                        username=username,
                        email=email,
                        password=make_password(password),
                        role='STUDENT',
                        school=instance.school,
                        is_active=True
                    )
                    instance.user = user
                    instance.save()
                 else:
                    # Link existing
                    user = User.objects.get(username=username)
                    user.password = make_password(password)
                    user.save()
                    instance.user = user
                    instance.save()
                    
            return instance
        except Exception as e:
            logger.exception(f"Student update failed: {str(e)}")
            raise e

class SubjectScoreSerializer(serializers.ModelSerializer):
    subject = serializers.CharField(source='subject.name', required=False)

    class Meta:
        model = SubjectScore
        fields = ['id', 'subject', 'ca1', 'ca2', 'exam', 'total', 'grade', 'comment']
        read_only_fields = ('school',)

class ReportCardSerializer(serializers.ModelSerializer):
    rows = SubjectScoreSerializer(many=True, source='scores', required=False)
    student_name = serializers.CharField(source='student.names', read_only=True)
    class_name = serializers.CharField(source='student_class.name', read_only=True)
    
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='student'
    )
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(), source='student_class'
    )
    grading_scheme_details = GradingSchemeSerializer(source='grading_scheme', read_only=True)

    class Meta:
        model = ReportCard
        fields = [
            'id', 'student_id', 'student_name', 'class_id', 'class_name', 
            'session', 'term', 'average', 'total_score', 'position',
            'attendance_present', 'attendance_total', 'affective', 'psychomotor',
            'teacher_remark', 'head_teacher_remark', 'next_term_begins', 
            'promoted_to', 'is_passed', 'passed_at', 'passed_by', 'rows',
            'grading_scheme', 'grading_scheme_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('school',)

    def get_validators(self):
        # Suppress automatic unique validation so we can handle it in create() via update_or_create
        return []

    def to_internal_value(self, data):
        data = data.copy()
        # Map frontend field names to backend fields if they differ
        # Using student_id as input is handled by the PrimaryKeyRelatedField source='student'
        return super().to_internal_value(data)

    def create(self, validated_data):
        scores_data = validated_data.pop('rows', None) or validated_data.pop('scores', [])
        
        school = validated_data.get('school')
        if not school and 'request' in self.context:
            school = getattr(self.context['request'].user, 'school', None)

        student = validated_data.pop('student')
        session = validated_data.pop('session')
        term = validated_data.pop('term')
        
        # Ensure school is explicitly set for creation if not in defaults
        if school:
            validated_data['school'] = school

        # Manual Upsert to handle unique constraints gracefully
        report_card = ReportCard.objects.filter(
            student=student, 
            session=session, 
            term=term
        ).first()

        if report_card:
            for attr, value in validated_data.items():
                setattr(report_card, attr, value)
            report_card.save()
        else:
            report_card = ReportCard.objects.create(
                student=student,
                session=session,
                term=term,
                **validated_data
            )
        
        # Update scores efficiently
        self._update_scores(report_card, scores_data, school)
        
        # Recalculate positions for the class
        if report_card.student_class:
            ReportCard.calculate_positions(school, report_card.student_class, session, term)
            # Reload to get the new position
            report_card.refresh_from_db()
        
        return report_card

    def update(self, instance, validated_data):
        scores_data = validated_data.pop('rows', None) or validated_data.pop('scores', None)
        school = instance.school
        
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            
            if scores_data is not None:
                self._update_scores(instance, scores_data, school)
            
            # Recalculate positions for the class
            if instance.student_class:
                ReportCard.calculate_positions(school, instance.student_class, instance.session, instance.term)
                instance.refresh_from_db()
                
        return instance

    def _update_scores(self, report_card, scores_data, school):
        """Helper to sync scores without deleting everything if possible"""
        existing_scores = {s.subject.name: s for s in report_card.scores.all()}
        
        for score_item in scores_data:
            subject_val = score_item.pop('subject', None)
            
            # Handle source='subject.name' which can return a dict for input in some DRF versions/configs
            if isinstance(subject_val, dict):
                subject_name = subject_val.get('name')
            else:
                subject_name = subject_val
                
            if not subject_name:
                continue
                
            if subject_name in existing_scores:
                score_obj = existing_scores.pop(subject_name)
                for attr, value in score_item.items():
                    setattr(score_obj, attr, value)
                score_obj.save()
            else:
                subject, _ = Subject.objects.get_or_create(name=subject_name, school=school)
                SubjectScore.objects.create(report_card=report_card, school=school, subject=subject, **score_item)
            
        # Delete scores for subjects no longer in the report card (if they exist in DB but not in current update)
        for remaining_score in existing_scores.values():
            remaining_score.delete()
            
        report_card.update_totals()

class AttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSession
        fields = '__all__'
        read_only_fields = ('school',)

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ('school',)

class SchoolEventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = SchoolEvent
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 'event_type', 
                  'target_audience', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ('school', 'created_by')

class LessonSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='student_class.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from core.media_utils import get_media_url
        if instance.file_url:
            ret['file_url'] = get_media_url(instance.file_url)
        return ret

class ConductEntrySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.names', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.username', read_only=True)
    
    class Meta:
        model = ConductEntry
        fields = '__all__'
        read_only_fields = ('school', 'recorded_by')


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = '__all__'
        read_only_fields = ('school',)

class TimetableEntrySerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    period_start = serializers.TimeField(source='period.start_time', read_only=True)
    
    class Meta:
        model = TimetableEntry
        fields = '__all__'
        read_only_fields = ('school',)

class TimetableSerializer(serializers.ModelSerializer):
    entries = TimetableEntrySerializer(many=True, read_only=True)
    class_name = serializers.CharField(source='student_class.name', read_only=True)
    
    class Meta:
        model = Timetable
        fields = ['id', 'title', 'student_class', 'class_name', 'is_active', 'entries', 'created_at', 'updated_at']
        read_only_fields = ('school',)

class SubjectTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectTeacher
        fields = '__all__'
        read_only_fields = ('school',)
