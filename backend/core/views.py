from rest_framework.views import APIView
import logging

logger = logging.getLogger(__name__)
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
import uuid
import os
from .models import (
    GlobalActivityLog, SchoolMessage, Conversation, ConversationParticipant,
    PlatformAnnouncement, Notification, SchoolAnnouncement, Newsletter
)
# from emails.models import EmailTemplate
from .serializers import (
    GlobalActivityLogSerializer, SchoolMessageSerializer, 
    ConversationSerializer, ConversationParticipantSerializer,
    PlatformAnnouncementSerializer, NotificationSerializer, 
    SchoolAnnouncementSerializer, NewsletterSerializer
)
from emails.utils import send_template_email
from .pagination import StandardPagination
from .cache_utils import CachingMixin
from schools.models import SchoolSettings
from academic.serializers import Base64ImageField

SETTINGS_VERSION = "1.0.2"

class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

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
                    'school_name': 'Registra Platform',
                    'subscription_status': 'active', 
                    'current_session': '2025/2026',
                })

            from schools.models import SchoolSettings
            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)
            
            sub_status = 'none'
            if hasattr(school, 'subscription'):
                sub_status = school.subscription.status

            from django.core.files.storage import default_storage
            
            from core.media_utils import get_media_url

            # Merge School and Settings data
            return Response({
                'id': str(settings_obj.id),
                'school_name': school.name,
                'school_address': school.address or '',
                'school_email': school.email or '',
                'school_phone': school.phone or '',
                'school_tagline': settings_obj.school_tagline or '',
                'logo_media': get_media_url(school.logo),
                'current_session': settings_obj.current_session,
                'current_term': settings_obj.current_term,
                'watermark_media': get_media_url(settings_obj.watermark_media),
                
                'director_name': settings_obj.director_name or '',
                'director_signature': get_media_url(settings_obj.director_signature),
                'head_of_school_name': settings_obj.head_of_school_name or '',
                'head_of_school_signature': get_media_url(settings_obj.head_of_school_signature),
                
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
                'landing_hero_image': get_media_url(settings_obj.landing_hero_image),
                'landing_gallery_images': [get_media_url(img) for img in settings_obj.landing_gallery_images],
                'landing_primary_color': settings_obj.landing_primary_color,
                'landing_show_stats': settings_obj.landing_show_stats,
                'landing_cta_text': settings_obj.landing_cta_text,
                'landing_core_values': settings_obj.landing_core_values,
                'landing_academic_programs': [
                    {**p, 'image': get_media_url(p.get('image'))} for p in settings_obj.landing_academic_programs
                ],
                'landing_testimonials': [
                    {**t, 'image': get_media_url(t.get('image'))} for t in settings_obj.landing_testimonials
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
                'domain': school.domain,
                'custom_domain': school.custom_domain,
                'subscription': {
                    'status': sub_status,
                    'plan': {
                        'custom_domain_enabled': school.subscription.plan.custom_domain_enabled if hasattr(school, 'subscription') and school.subscription and school.subscription.plan else False
                    }
                },
                'api_version': SETTINGS_VERSION,
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
        # Security: Only authenticated admins can update settings
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        if request.user.role not in ('SCHOOL_ADMIN', 'SUPER_ADMIN') and not request.user.is_superuser:
            return Response({'error': 'Only admins can update settings'}, status=403)

        school = self.get_school(request)
        if not school:
            logger.error("[SETTINGS_PUT] School context not found")
            return Response({'error': 'School not found'}, status=404)

        logger.info(f"[SETTINGS_PUT] Starting update for school: {school.domain}")
        from django.db import transaction
        
        try:
            with transaction.atomic():
                data = request.data
                if not isinstance(data, dict):
                    logger.warning(f"[SETTINGS_PUT] Unexpected data format: {type(data)}")
                
                settings_obj, created = SchoolSettings.objects.get_or_create(school=school)
                if created:
                    logger.info(f"[SETTINGS_PUT] Created new settings object for {school.domain}")
                
                # Helper to handle base64 images for CharFields (e.g. school.logo)
                def process_base64(val):
                    if val and isinstance(val, str) and val.startswith('data:image'):
                        try:
                            field = Base64ImageField()
                            return field.to_internal_value(val)
                        except Exception as img_e:
                            logger.error(f"[SETTINGS_PUT] Base64 processing failed: {str(img_e)}")
                            return val
                    return val

                def clean_date(val):
                    if not val or val == '': return None
                    return val

                # 1. Update School model
                try:
                    if 'school_name' in data: school.name = data['school_name']
                    if 'school_address' in data: school.address = data['school_address']
                    if 'school_email' in data: school.email = data['school_email']
                    if 'school_phone' in data: school.phone = data['school_phone']
                    if 'custom_domain' in data: school.custom_domain = data['custom_domain']
                    if 'logo_media' in data: 
                        school.logo = process_base64(data['logo_media'])
                    school.save()
                except Exception as school_e:
                    logger.error(f"[SETTINGS_PUT] School model save failed: {str(school_e)}")
                    raise school_e
                
                # 2. Update SchoolSettings model - Basic Fields
                try:
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
                except Exception as basic_e:
                    logger.error(f"[SETTINGS_PUT] Basic settings update failed: {str(basic_e)}")
                    raise basic_e
                
                # 3. CMS / Landing Page Fields
                try:
                    if 'landing_hero_title' in data: settings_obj.landing_hero_title = data['landing_hero_title']
                    if 'landing_hero_subtitle' in data: settings_obj.landing_hero_subtitle = data['landing_hero_subtitle']
                    if 'landing_features' in data: settings_obj.landing_features = data['landing_features']
                    if 'landing_about_text' in data: settings_obj.landing_about_text = data['landing_about_text']
                    if 'landing_hero_image' in data: settings_obj.landing_hero_image = process_base64(data['landing_hero_image'])
                    if 'landing_gallery_images' in data and isinstance(data['landing_gallery_images'], list):
                        settings_obj.landing_gallery_images = [process_base64(img) for img in data['landing_gallery_images']]
                    
                    for field in ['landing_primary_color', 'landing_show_stats', 'landing_cta_text', 'landing_stats_config']:
                        if field in data: setattr(settings_obj, field, data[field])

                    if 'landing_core_values' in data:
                        settings_obj.landing_core_values = data['landing_core_values']

                    if 'landing_academic_programs' in data and isinstance(data['landing_academic_programs'], list):
                        programs = []
                        for p in data['landing_academic_programs']:
                            if not isinstance(p, dict): continue
                            img = p.get('image')
                            if img and isinstance(img, str) and img.startswith('data:image'):
                                img = process_base64(img)
                            programs.append({**p, 'image': img})
                        settings_obj.landing_academic_programs = programs

                    if 'landing_testimonials' in data and isinstance(data['landing_testimonials'], list):
                        testimonials = []
                        for t in data['landing_testimonials']:
                            if not isinstance(t, dict): continue
                            img = t.get('image')
                            if img and isinstance(img, str) and img.startswith('data:image'):
                                img = process_base64(img)
                            testimonials.append({**t, 'image': img})
                        settings_obj.landing_testimonials = testimonials
                except Exception as cms_e:
                    logger.error(f"[SETTINGS_PUT] CMS settings update failed: {str(cms_e)}")
                    raise cms_e
                
                # 4. Promotion, Finance & Permissions
                try:
                    def to_int(val, default=0):
                        if val is None or val == '': return default
                        try: return int(val)
                        except: return default

                    if 'promotion_threshold' in data: settings_obj.promotion_threshold = to_int(data['promotion_threshold'], 50)
                    if 'promotion_rules' in data: settings_obj.promotion_rules = data['promotion_rules']
                    
                    if 'show_bank_details' in data: settings_obj.show_bank_details = data['show_bank_details']
                    if 'bank_name' in data: settings_obj.bank_name = data['bank_name']
                    if 'bank_account_name' in data: settings_obj.bank_account_name = data['bank_account_name']
                    if 'bank_account_number' in data: settings_obj.bank_account_number = data['bank_account_number']
                    if 'bank_sort_code' in data: settings_obj.bank_sort_code = data['bank_sort_code']
                    if 'invoice_notes' in data: settings_obj.invoice_notes = data['invoice_notes']
                    if 'invoice_due_days' in data: settings_obj.invoice_due_days = to_int(data['invoice_due_days'], 14)
                    
                    if 'role_permissions' in data: settings_obj.role_permissions = data['role_permissions']
                    
                    # Also handle report_scale if present
                    if 'report_scale' in data: settings_obj.report_scale = to_int(data['report_scale'], 100)
                except Exception as finance_e:
                    logger.error(f"[SETTINGS_PUT] Finance/Permissions update failed: {str(finance_e)}")
                    raise finance_e
                
                settings_obj.save()
                logger.info(f"[SETTINGS_PUT] Successfully saved all settings for {school.domain}")
            
            return self.get(request)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Settings update FAILED for school {school.domain if school else 'unknown'}")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Traceback: {error_trace}")
            
            return Response({
                'error': 'Failed to save settings',
                'detail': str(e),
                'type': type(e).__name__,
                'hint': 'Please check if all numeric fields are valid numbers.'
            }, status=400)

class PublicSettingsView(APIView):
    """
    Lightweight, unauthenticated endpoint for SEO metadata and landing pages.
    Returns ONLY safe public fields — no bank details, no permissions, no internal config.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        domain = request.META.get('HTTP_X_TENANT_ID', 'demo')
        try:
            from schools.models import School, SchoolSettings
            from core.media_utils import get_media_url

            school = School.objects.get(domain=domain)
            settings_obj, _ = SchoolSettings.objects.get_or_create(school=school)

            return Response({
                'school_name': school.name,
                'school_tagline': settings_obj.school_tagline or '',
                'school_email': school.email or '',
                'school_phone': school.phone or '',
                'logo_media': get_media_url(school.logo),
                'landing_primary_color': settings_obj.landing_primary_color,
                'domain': school.domain,
            })
        except Exception:
            return Response({
                'school_name': 'Registra',
                'school_tagline': 'The operating system for modern schools',
            })


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


class ConversationViewSet(CachingMixin, viewsets.ModelViewSet):
    """
    Groups of participants and their messages.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Conversation.objects.none()

        # Use tenant middleware if available, fallback to user.school
        school = getattr(self.request, 'tenant', None) or getattr(user, 'school', None)
        if not school:
            return Conversation.objects.none()

        # Subquery annotations to avoid N+1 in serializer
        from django.db.models import Subquery, OuterRef, Count, Q
        from users.models import User

        latest_msg = SchoolMessage.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-created_at')

        # Get current user's last_read_at for unread calculation
        user_participant = ConversationParticipant.objects.filter(
            conversation=OuterRef('pk'),
            user=user
        )

        qs = Conversation.objects.filter(
            school=school,
            participants__user=user
        ).annotate(
            _last_msg_body=Subquery(latest_msg.values('body')[:1]),
            _last_msg_sender=Subquery(
                latest_msg.annotate(
                    _sender_name=Subquery(
                        User.objects.filter(pk=OuterRef('sender_id')).values('username')[:1]
                    )
                ).values('_sender_name')[:1]
            ),
            _last_msg_time=Subquery(latest_msg.values('created_at')[:1]),
            _user_last_read=Subquery(user_participant.values('last_read_at')[:1]),
        ).prefetch_related('participants__user').order_by('-_last_msg_time', '-created_at').distinct()

        return qs

    def create(self, request, *args, **kwargs):
        """Custom create that handles duplicate prevention gracefully."""
        user = request.user
        school = getattr(request, 'tenant', None) or getattr(user, 'school', None)
        if not school:
            return Response({"detail": "No school context found."}, status=400)

        participant_ids = request.data.get('participant_ids', [])
        conv_type = request.data.get('type', 'DIRECT')

        # For DIRECT conversations, return existing one instead of creating duplicate
        if conv_type == 'DIRECT' and len(participant_ids) == 1:
            other_id = participant_ids[0]
            existing = Conversation.objects.filter(
                school=school,
                type='DIRECT',
                participants__user=user
            ).filter(
                participants__user_id=other_id
            ).first()
            if existing:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=200)

        # Normal creation flow
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conv = serializer.save(school=school)

        # Add creator as participant
        ConversationParticipant.objects.create(user=user, conversation=conv)

        # Add other participants
        for pid in participant_ids:
            if pid != user.id:
                ConversationParticipant.objects.get_or_create(user_id=pid, conversation=conv)

        # Re-serialize to include participants
        out_serializer = self.get_serializer(conv)
        return Response(out_serializer.data, status=201)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        conv = self.get_object()
        participant = conv.participants.filter(user=request.user).first()
        if participant:
            participant.last_read_at = timezone.now()
            participant.save()
            return Response({"status": "read"})
        return Response({"error": "not a participant"}, status=403)

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        """Archive a conversation for the current user (soft delete)."""
        conv = self.get_object()
        participant = conv.participants.filter(user=request.user).first()
        if participant:
            participant.is_archived = True
            participant.save()
            return Response({"status": "archived"})
        return Response({"error": "not a participant"}, status=403)

class SchoolMessageViewSet(CachingMixin, viewsets.ModelViewSet):
    """Messaging within a conversation thread"""
    permission_classes = [IsAuthenticated]
    serializer_class = SchoolMessageSerializer
    pagination_class = StandardPagination
    cache_timeout = 30  # Low cache for active messaging

    def get_queryset(self):
        user = self.request.user
        conversation_id = self.request.query_params.get('conversation')
        
        if not conversation_id:
            # Fallback for compatibility or global view (though grouped is better)
            return SchoolMessage.objects.filter(conversation__participants__user=user).select_related('sender', 'conversation')
            
        # High security: must be a participant
        if not ConversationParticipant.objects.filter(user=user, conversation_id=conversation_id).exists():
            return SchoolMessage.objects.none()
            
        return SchoolMessage.objects.filter(conversation_id=conversation_id).select_related('sender')

    def perform_create(self, serializer):
        conversation = serializer.validated_data.get('conversation')
        
        # Ensure participant or broadcast sender
        if not ConversationParticipant.objects.filter(user=self.request.user, conversation=conversation).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Not a participant in this conversation")
            
        msg = serializer.save(sender=self.request.user)
        
        # Update last_read_at for this participant
        ConversationParticipant.objects.filter(
            user=self.request.user, conversation=conversation
        ).update(last_read_at=timezone.now())

        # Auto-create notifications for other participants
        other_participants = ConversationParticipant.objects.filter(
            conversation=conversation
        ).exclude(user=self.request.user).select_related('user')

        school = getattr(self.request, 'tenant', None) or getattr(self.request.user, 'school', None)
        if school:
            notifications = [
                Notification(
                    school=school,
                    user=p.user,
                    title=f"New message from {self.request.user.username}",
                    message=msg.body[:200],
                    category='system',
                    link='/dashboard/messages'
                )
                for p in other_participants
            ]
            Notification.objects.bulk_create(notifications)

    @action(detail=False, methods=['post'], url_path='ai-draft')
    def ai_draft(self, request):
        """
        AI-powered professional message drafting.
        Body: { "topic": str, "recipient_type": str, "key_points": str, "tone": "formal" }
        """
        from academic.ai_utils import AcademicAI
        school = getattr(request.user, 'school', None)
        school_name = school.name if school else 'Our School'

        context = {
            'school_name': school_name,
            'recipient_type': request.data.get('recipient_type', 'Parents'),
            'topic': request.data.get('topic', 'General Update'),
            'key_points': request.data.get('key_points', '')
        }
        tone = request.data.get('tone', 'formal')

        try:
            ai = AcademicAI()
            if not ai.model:
                return Response({"error": "AI service is not configured. Please contact the administrator."}, status=503)

            draft = ai.draft_professional_message(context, tone=tone)

            if not draft:
                return Response({"error": "AI drafting failed. Please try again."}, status=503)

            return Response({"draft": draft})
        except Exception as e:
            logger.error(f"AI Draft Error: {str(e)}", exc_info=True)
            return Response({"error": f"An error occurred: {str(e)}"}, status=500)

class NotificationViewSet(viewsets.ModelViewSet):
    """Per-user in-app notifications — read-only for regular users."""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = StandardPagination
    # Only admins can create notifications via API; regular users are read-only
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"marked_read": count})


class SchoolAnnouncementViewSet(CachingMixin, viewsets.ModelViewSet):
    """School-specific announcements"""
    permission_classes = [IsAuthenticated]
    serializer_class = SchoolAnnouncementSerializer
    pagination_class = StandardPagination
    cache_timeout = 300 # 5 minutes

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return SchoolAnnouncement.objects.none()

        school = getattr(self.request, 'tenant', None) or getattr(user, 'school', None)
        if not school:
            return SchoolAnnouncement.objects.none()
        
        qs = SchoolAnnouncement.objects.filter(school=school)
        
        # Staff/Admins see all (including inactive), others only see active
        if user.role not in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'TEACHER'):
            qs = qs.filter(is_active=True)
            
        return qs.select_related('author', 'school')

    def perform_create(self, serializer):
        school = getattr(self.request, 'tenant', None) or getattr(self.request.user, 'school', None)
        if not school:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Cannot create announcement: no school context found."})
        serializer.save(
            author=self.request.user, 
            school=school,
            author_role=self.request.user.role
        )

class NewsletterViewSet(CachingMixin, viewsets.ModelViewSet):
    """School newsletters"""
    permission_classes = [IsAuthenticated]
    serializer_class = NewsletterSerializer
    pagination_class = StandardPagination
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not hasattr(user, 'school'):
            return Newsletter.objects.none()
            
        qs = Newsletter.objects.filter(school=user.school)
        
        # Staff/Admins see all (including unpublished), others only see published
        if user.role not in ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'TEACHER'):
            qs = qs.filter(is_published=True)
            
        return qs.select_related('school')

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'school') and self.request.user.school:
            serializer.save(school=self.request.user.school)

    @action(detail=False, methods=['post'], url_path='ai-generate')
    def ai_generate(self, request):
        """
        AI-powered newsletter content generation.
        Body: { "period": "February 2026" }
        """
        from academic.ai_utils import AcademicAI
        from academic.models import SchoolEvent, StudentAchievement, Student, Teacher

        try:
            school = getattr(request.user, 'school', None)
            if not school:
                return Response({"error": "School not found"}, status=400)

            period = request.data.get('period', 'This Month')

            # Gather school data for the AI
            events = list(SchoolEvent.objects.filter(school=school).order_by('-start_date')[:10].values('title', 'event_type', 'start_date'))
            achievements = list(StudentAchievement.objects.filter(school=school).order_by('-date_achieved')[:5].values('title', 'category'))
            stats = {
                'total_students': Student.objects.filter(school=school, status='active').count(),
                'total_teachers': Teacher.objects.filter(school=school).count(),
            }

            school_data = {
                'school_name': school.name,
                'period': period,
                'events': [{'title': e['title'], 'type': e['event_type']} for e in events],
                'achievements': [{'title': a['title'], 'category': a['category']} for a in achievements],
                'stats': stats
            }

            ai = AcademicAI()
            if not ai.model:
                return Response({"error": "AI service is not configured. Please set the GEMINI_API_KEY in the server environment."}, status=503)

            content = ai.synthesize_newsletter(school_data)

            if not content:
                return Response({"error": "AI newsletter generation failed. The AI service may be temporarily unavailable."}, status=503)

            return Response({"content": content, "title": f"{school.name} Newsletter - {period}"})
        except Exception as e:
            logger.error(f"Newsletter AI Generate Error: {str(e)}", exc_info=True)
            return Response({"error": f"An error occurred: {str(e)}"}, status=500)

