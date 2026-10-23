from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import EmailCampaign, EmailLog, EmailTemplate
from .serializers import EmailCampaignSerializer, EmailLogSerializer, EmailTemplateSerializer
from .tasks import process_campaign_task


from users.permissions import IsSuperAdmin


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all().order_by("-created_at")
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsSuperAdmin]


class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all().order_by("-created_at")
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsSuperAdmin]

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Return aggregate email marketing statistics."""
        total_logs = EmailLog.objects.count()
        sent_count = EmailLog.objects.filter(status="sent").count()
        failed_count = EmailLog.objects.filter(status="failed").count()
        campaign_count = EmailCampaign.objects.count()

        # Calculate success rate
        success_rate = round((sent_count / total_logs * 100), 1) if total_logs > 0 else 0

        return Response(
            {
                "total_sent": sent_count,
                "total_failed": failed_count,
                "total_emails": total_logs,
                "campaign_count": campaign_count,
                "success_rate": success_rate,
            }
        )

    @action(detail=True, methods=["post"])
    def send_campaign(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status in ["sending", "completed"]:
            return Response({"error": f"Campaign is already {campaign.status}"}, status=400)

        # Try async first, fall back to sync
        try:
            process_campaign_task.delay(campaign.id)
        except Exception:
            process_campaign_task(campaign.id)
        return Response({"status": "Campaign sending queued"})

    @action(detail=False, methods=["post"], url_path="send-individual")
    def send_individual(self, request):
        """
        Send a one-off professional email to an arbitrary recipient.
        Runs synchronously so it works even without Celery.
        """
        recipient = request.data.get("recipient")
        subject = request.data.get("subject")
        body = request.data.get("body")

        if not all([recipient, subject, body]):
            return Response({"error": "Missing recipient, subject or body"}, status=400)

        # Send synchronously for reliability
        from .utils import send_custom_email

        success = send_custom_email(recipient, subject, body)

        if success:
            return Response({"status": "Email sent successfully"})
        else:
            return Response({"error": "Email sending failed. Check SMTP configuration."}, status=500)


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.select_related("template", "campaign").all().order_by("-sent_at")
    serializer_class = EmailLogSerializer
    permission_classes = [IsSuperAdmin]


class EmailStatusView(APIView):
    """
    GET: is email configured, through which provider and sender, and the most recent failures.
    POST {"recipient"}: send a test email now and report the provider's answer.
    Secrets (passwords, API keys) are never returned.
    """

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        from .utils import NOT_CONFIGURED, email_config

        config = email_config()
        failures = EmailLog.objects.filter(status="failed").order_by("-sent_at")[:10]
        last_24h = EmailLog.objects.filter(sent_at__gte=timezone.now() - timedelta(hours=24))
        return Response(
            {
                "configured": config["configured"],
                "problem": "" if config["configured"] else NOT_CONFIGURED,
                "provider": "Brevo API" if config["provider"] == "brevo_api" else "SMTP",
                "from": f"{config['from_name']} <{config['from_email']}>",
                "smtp_host": config["host"] if config["provider"] != "brevo_api" else "",
                "last_24h": {
                    "sent": last_24h.filter(status="sent").count(),
                    "failed": last_24h.filter(status="failed").count(),
                },
                "recent_failures": [
                    {"recipient": f.recipient, "subject": f.subject, "error": f.error_message[:300], "at": f.sent_at}
                    for f in failures
                ],
            }
        )

    def post(self, request):
        from .utils import email_config, send_template_email

        recipient = (request.data.get("recipient") or request.user.email or "").strip()
        if not recipient:
            return Response({"detail": "Enter an email address to send the test to."}, status=400)
        provider = "Brevo API" if email_config()["provider"] == "brevo_api" else "SMTP"
        if send_template_email("test_email", recipient, {"provider": provider}):
            return Response({"detail": f"Test email sent to {recipient} via {provider}."})
        error = EmailLog.objects.filter(recipient=recipient).order_by("-sent_at").first()
        return Response(
            {"detail": f"Test email failed: {error.error_message if error else 'unknown error'}"}, status=502
        )
