from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
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

    @action(detail=True, methods=['post'])
    def send_campaign(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status in ['sending', 'completed']:
            return Response({'error': f'Campaign is already {campaign.status}'}, status=400)
        
        process_campaign_task.delay(campaign.id)
        return Response({'status': 'Campaign sending queued'})

    @action(detail=False, methods=['post'], url_path='send-individual')
    def send_individual(self, request):
        """
        Send a one-off professional email to an arbitrary recipient.
        """
        recipient = request.data.get('recipient')
        subject = request.data.get('subject')
        body = request.data.get('body')
        
        if not all([recipient, subject, body]):
            return Response({'error': 'Missing recipient, subject or body'}, status=400)
        
        send_custom_email_task.delay(recipient, subject, body)
        return Response({'status': 'Individual email queued'})

class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.all().order_by('-sent_at')
    serializer_class = EmailLogSerializer
    permission_classes = [IsSuperAdmin]
