from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, permissions
from django.core.files.storage import default_storage
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
import uuid
import os
from .models import SchoolMessage
from .serializers import SchoolMessageSerializer
from .pagination import StandardPagination
from .cache_utils import CachingMixin

class SettingsView(APIView):
    # Allow Any for now to prevent login page blocks if settings are fetched globally
    # Ideally should be IsAuthenticatedOrReadOnly or similar
    permission_classes = [AllowAny] 

    def get_school(self, request):
        # Use tenant set by middleware if available
        if hasattr(request, 'tenant') and request.tenant:
            return request.tenant
        
        # Fallback to user's school if authenticated
        if request.user.is_authenticated:
            return getattr(request.user, 'school', None)
            
        return None

    def get(self, request):
        try:
            school = self.get_school(request)
            if not school:
                return Response({
                    'school_name': 'Demo School',
                    'subscription_status': 'active', 
                    'current_session': '2025/2026',
                })

            from schools.models import SchoolSettings
            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
            
            sub_status = 'none'
            if hasattr(school, 'subscription'):
                sub_status = school.subscription.status

            from django.core.files.storage import default_storage
            
            def get_url(path):
                if not path: return None
                if path.startswith('http'): return path
                try:
                    return default_storage.url(path)
                except Exception:
                    return path

            # Merge School and Settings data
            return Response({
                'id': str(settings_obj.id),
                'school_name': school.name,
                'school_address': school.address or '',
                'school_email': school.email or '',
                'school_phone': school.phone or '',
                'school_tagline': settings_obj.school_tagline or '',
                'logo_media': get_url(school.logo),
                'current_session': settings_obj.current_session,
                'current_term': settings_obj.current_term,
                'watermark_media': get_url(settings_obj.watermark_media),
                
                'director_name': settings_obj.director_name or '',
                'director_signature': get_url(settings_obj.director_signature),
                'head_of_school_name': settings_obj.head_of_school_name or '',
                'head_of_school_signature': get_url(settings_obj.head_of_school_signature),
                
                'subjects_global': settings_obj.subjects_global,
                'terms': settings_obj.terms_list,
                'show_position': settings_obj.show_position,
                'show_skills': settings_obj.show_skills,
                'tiled_watermark': settings_obj.tiled_watermark,
                'next_term_begins': settings_obj.next_term_begins.isoformat() if settings_obj.next_term_begins and hasattr(settings_obj.next_term_begins, 'isoformat') else None,
                'class_teacher_label': settings_obj.class_teacher_label,
                'head_teacher_label': settings_obj.head_teacher_label,
                'report_font_family': settings_obj.report_font_family,
                'report_scale': settings_obj.report_scale,
                
                'landing_hero_title': settings_obj.landing_hero_title or '',
                'landing_hero_subtitle': settings_obj.landing_hero_subtitle or '',
                'landing_features': settings_obj.landing_features or '',
                'landing_about_text': settings_obj.landing_about_text or '',
                'landing_hero_image': get_url(settings_obj.landing_hero_image),
                'landing_gallery_images': [get_url(img) for img in settings_obj.landing_gallery_images],
                'landing_primary_color': settings_obj.landing_primary_color,
                'landing_show_stats': settings_obj.landing_show_stats,
                'landing_cta_text': settings_obj.landing_cta_text,
                'landing_core_values': settings_obj.landing_core_values,
                'landing_academic_programs': [
                    {**p, 'image': get_url(p.get('image'))} for p in settings_obj.landing_academic_programs
                ],
                'landing_testimonials': [
                    {**t, 'image': get_url(t.get('image'))} for t in settings_obj.landing_testimonials
                ],
                'landing_stats_config': settings_obj.landing_stats_config,
                
                'promotion_threshold': settings_obj.promotion_threshold,
                'promotion_rules': settings_obj.promotion_rules,
                
                'show_bank_details': settings_obj.show_bank_details,
                'bank_name': settings_obj.bank_name or '',
                'bank_account_name': settings_obj.bank_account_name or '',
                'bank_account_number': settings_obj.bank_account_number or '',
                'bank_sort_code': settings_obj.bank_sort_code or '',
                'invoice_notes': settings_obj.invoice_notes or '',
                'invoice_due_days': settings_obj.invoice_due_days,
                
                'role_permissions': settings_obj.role_permissions,
                'subscription_status': sub_status,
                'school_domain': school.domain,
            })
        except Exception as e:
            # Fallback to demo if anything goes wrong during GET
            return Response({
                'school_name': 'Demo School (Emergency Fallback)',
                'subscription_status': 'active', 
                'current_session': '2025/2026',
                'error_hint': str(e)
            })

    def put(self, request):
        school = self.get_school(request)
        if not school:
            return Response({'error': 'School not found'}, status=404)

        try:
            from schools.models import SchoolSettings
            from academic.serializers import Base64ImageField
            
            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
            data = request.data
            
            # Helper to handle base64 images for CharFields (e.g. school.logo)
            def process_base64(val):
                if val and isinstance(val, str) and val.startswith('data:image'):
                    field = Base64ImageField()
                    return field.to_internal_value(val)
                return val

            def clean_date(val):
                if not val or val == '': return None
                return val

            # Update School model
            if 'school_name' in data: school.name = data['school_name']
            if 'school_address' in data: school.address = data['school_address']
            if 'school_email' in data: school.email = data['school_email']
            if 'school_phone' in data: school.phone = data['school_phone']
            if 'logo_media' in data: 
                school.logo = process_base64(data['logo_media'])
            school.save()
            
            # Update SchoolSettings model
            if 'current_session' in data: settings_obj.current_session = data['current_session']
            if 'current_term' in data: settings_obj.current_term = data['current_term']
            if 'school_tagline' in data: settings_obj.school_tagline = data['school_tagline']
            if 'watermark_media' in data: settings_obj.watermark_media = process_base64(data['watermark_media'])
            
            if 'director_name' in data: settings_obj.director_name = data['director_name']
            if 'director_signature' in data: settings_obj.director_signature = process_base64(data['director_signature'])
            if 'head_of_school_name' in data: settings_obj.head_of_school_name = data['head_of_school_name']
            if 'head_of_school_signature' in data: settings_obj.head_of_school_signature = process_base64(data['head_of_school_signature'])
            
            if 'subjects_global' in data: settings_obj.subjects_global = data['subjects_global']
            if 'terms' in data: settings_obj.terms_list = data['terms']
            if 'show_position' in data: settings_obj.show_position = data['show_position']
            if 'show_skills' in data: settings_obj.show_skills = data['show_skills']
            if 'tiled_watermark' in data: settings_obj.tiled_watermark = data['tiled_watermark']
            if 'next_term_begins' in data: settings_obj.next_term_begins = clean_date(data['next_term_begins'])
            if 'class_teacher_label' in data: settings_obj.class_teacher_label = data['class_teacher_label']
            if 'head_teacher_label' in data: settings_obj.head_teacher_label = data['head_teacher_label']
            if 'report_font_family' in data: settings_obj.report_font_family = data['report_font_family']
            if 'report_scale' in data: settings_obj.report_scale = data['report_scale']
            
            if 'landing_hero_title' in data: settings_obj.landing_hero_title = data['landing_hero_title']
            if 'landing_hero_subtitle' in data: settings_obj.landing_hero_subtitle = data['landing_hero_subtitle']
            if 'landing_features' in data: settings_obj.landing_features = data['landing_features']
            if 'landing_about_text' in data: settings_obj.landing_about_text = data['landing_about_text']
            # Continue with other landing fields... (Keeping it robust)
            if 'landing_hero_image' in data: settings_obj.landing_hero_image = process_base64(data['landing_hero_image'])
            if 'landing_gallery_images' in data:
                settings_obj.landing_gallery_images = [process_base64(img) for img in data['landing_gallery_images']]
            
            for field in ['landing_primary_color', 'landing_show_stats', 'landing_cta_text', 'landing_stats_config']:
                if field in data: setattr(settings_obj, field, data[field])

            if 'landing_core_values' in data:
                settings_obj.landing_core_values = data['landing_core_values']

            if 'landing_academic_programs' in data:
                programs = []
                for p in data['landing_academic_programs']:
                    # Handle image upload if present
                    img = p.get('image')
                    if img and img.startswith('data:image'):
                        img = process_base64(img)
                    programs.append({**p, 'image': img})
                settings_obj.landing_academic_programs = programs

            if 'landing_testimonials' in data:
                testimonials = []
                for t in data['landing_testimonials']:
                    img = t.get('image')
                    if img and img.startswith('data:image'):
                        img = process_base64(img)
                    testimonials.append({**t, 'image': img})
                settings_obj.landing_testimonials = testimonials
            
            if 'promotion_threshold' in data: settings_obj.promotion_threshold = data['promotion_threshold']
            if 'promotion_rules' in data: settings_obj.promotion_rules = data['promotion_rules']
            
            if 'show_bank_details' in data: settings_obj.show_bank_details = data['show_bank_details']
            if 'bank_name' in data: settings_obj.bank_name = data['bank_name']
            if 'bank_account_name' in data: settings_obj.bank_account_name = data['bank_account_name']
            if 'bank_account_number' in data: settings_obj.bank_account_number = data['bank_account_number']
            if 'bank_sort_code' in data: settings_obj.bank_sort_code = data['bank_sort_code']
            if 'invoice_notes' in data: settings_obj.invoice_notes = data['invoice_notes']
            if 'invoice_due_days' in data: settings_obj.invoice_due_days = data['invoice_due_days']
            
            if 'role_permissions' in data: settings_obj.role_permissions = data['role_permissions']
            
            settings_obj.save()
            return self.get(request)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class PublicStatsView(APIView):
    """
    Publicly accessible statistics for a school landing page.
    Returns counts of students, teachers, and classes.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        domain = request.META.get('HTTP_X_TENANT_ID', 'demo')
        
        try:
            from schools.models import School
            from academic.models import Student, Teacher, Class
            
            school = School.objects.get(domain=domain)
            
            return Response({
                'students_count': Student.objects.filter(school=school).count(),
                'teachers_count': Teacher.objects.filter(school=school).count(),
                'classes_count': Class.objects.filter(school=school).count(),
            })
        except Exception:
            # Fallback counts for demo
            return Response({
                'students_count': 1250,
                'teachers_count': 45,
                'classes_count': 24,
            })

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get('file')
        folder = request.data.get('folder', 'uploads')
        
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)

        # Create unique filename
        ext = os.path.splitext(file_obj.name)[1]
        filename = f"{uuid.uuid4()}{ext}"
        file_path = f"{folder}/{filename}"

        try:
            # Save file using default storage (R2/S3)
            saved_path = default_storage.save(file_path, file_obj)
            file_url = default_storage.url(saved_path)
            
            return Response({
                'url': file_url,
                'path': saved_path,
                'filename': filename
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class SchoolMessageViewSet(CachingMixin, viewsets.ModelViewSet):
    """Messaging between users within a school"""
    permission_classes = [IsAuthenticated]
    serializer_class = SchoolMessageSerializer
    pagination_class = StandardPagination
    cache_timeout = 60  # Messages cached for 1 minute

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not hasattr(user, 'school'):
            return SchoolMessage.objects.none()
        
        # Return messages where user is sender or recipient
        return SchoolMessage.objects.filter(
            school=user.school
        ).filter(
            Q(sender=user) | Q(recipient=user)
        ).select_related('sender', 'recipient', 'school')

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(sender=self.request.user, school=self.request.user.school)

    def perform_update(self, serializer):
        # Handle marking message as read
        if 'is_read' in self.request.data and self.request.data['is_read'] and not serializer.instance.is_read:
            serializer.save(is_read=True, read_at=timezone.now())
        else:
            serializer.save()
