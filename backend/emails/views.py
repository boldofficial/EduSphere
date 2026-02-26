from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from .models import EmailTemplate, EmailLog, EmailCampaign
from .serializers import EmailTemplateSerializer, EmailLogSerializer, EmailCampaignSerializer
from .tasks import process_campaign_task, send_custom_email_task

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to users with 'SUPER_ADMIN' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SUPER_ADMIN')

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all().order_by('-created_at')
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsSuperAdmin]

class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all().order_by('-created_at')
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsSuperAdmin]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Return aggregate email marketing statistics."""
        total_logs = EmailLog.objects.count()
        sent_count = EmailLog.objects.filter(status='sent').count()
        failed_count = EmailLog.objects.filter(status='failed').count()
        campaign_count = EmailCampaign.objects.count()
        
        # Calculate success rate
        success_rate = round((sent_count / total_logs * 100), 1) if total_logs > 0 else 0
        
        return Response({
            'total_sent': sent_count,
            'total_failed': failed_count,
            'total_emails': total_logs,
            'campaign_count': campaign_count,
            'success_rate': success_rate,
        })

    @action(detail=True, methods=['post'])
    def send_campaign(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status in ['sending', 'completed']:
            return Response({'error': f'Campaign is already {campaign.status}'}, status=400)
        
        # Try async first, fall back to sync
        try:
            process_campaign_task.delay(campaign.id)
        except Exception:
            process_campaign_task(campaign.id)
        return Response({'status': 'Campaign sending queued'})

    @action(detail=False, methods=['post'], url_path='send-individual')
    def send_individual(self, request):
        """
        Send a one-off professional email to an arbitrary recipient.
        Runs synchronously so it works even without Celery.
        """
        recipient = request.data.get('recipient')
        subject = request.data.get('subject')
        body = request.data.get('body')
        
        if not all([recipient, subject, body]):
            return Response({'error': 'Missing recipient, subject or body'}, status=400)
        
        # Send synchronously for reliability
        from .utils import send_custom_email
        success = send_custom_email(recipient, subject, body)
        
        if success:
            return Response({'status': 'Email sent successfully'})
        else:
            return Response({'error': 'Email sending failed. Check SMTP configuration.'}, status=500)

class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.select_related('template', 'campaign').all().order_by('-sent_at')
    serializer_class = EmailLogSerializer
    permission_classes = [IsSuperAdmin]

