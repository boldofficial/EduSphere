import hashlib
import hmac
import json
import logging

from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from bursary.models import Payment
from core.models import GlobalActivityLog
from schools.models import School, SchoolPaymentConfig

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(View):
    """
    Receives Paystack event payloads, validates the signature against the
    school's own webhook secret, and records the payment automatically.

    URL pattern: POST /api/webhooks/paystack/<school_domain>/
    """

    def post(self, request, school_domain):
        # 1. Resolve the school
        try:
            school = School.objects.get(domain=school_domain)
        except School.DoesNotExist:
            logger.warning(f"Webhook received for unknown school domain: {school_domain}")
            return JsonResponse({"error": "Unknown school"}, status=404)

        # 2. Get the school's webhook secret
        try:
            config = SchoolPaymentConfig.objects.get(school=school)
        except SchoolPaymentConfig.DoesNotExist:
            logger.warning(f"No payment config for school: {school_domain}")
            return JsonResponse({"error": "Payment config not found"}, status=404)

        webhook_secret = config.paystack_webhook_secret
        if not webhook_secret:
            logger.warning(f"No Paystack webhook secret configured for: {school_domain}")
            return JsonResponse({"error": "Webhook secret not configured"}, status=400)

        # 3. Validate Paystack signature
        signature = request.headers.get("X-Paystack-Signature", "")
        body = request.body
        expected = hmac.new(
            webhook_secret.encode("utf-8"), body, hashlib.sha512
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            logger.warning(f"Invalid Paystack signature for: {school_domain}")
            return JsonResponse({"error": "Invalid signature"}, status=403)

        # 4. Parse the event
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        event = payload.get("event", "")
        data = payload.get("data", {})

        if event == "charge.success":
            self._handle_charge_success(school, data)
        else:
            logger.info(f"Ignoring Paystack event '{event}' for {school_domain}")

        # Always return 200 to Paystack to prevent retries
        return JsonResponse({"status": "ok"})

    def _handle_charge_success(self, school, data):
        """Mark a pending payment as completed based on the gateway reference."""
        gateway_ref = data.get("reference", "")
        if not gateway_ref:
            logger.warning("charge.success event missing reference")
            return

        try:
            payment = Payment.objects.get(
                school=school,
                gateway_reference=gateway_ref,
                status="pending",
            )
        except Payment.DoesNotExist:
            logger.info(f"No pending payment found for reference: {gateway_ref}")
            return

        payment.status = "completed"
        payment.verification_data = data
        payment.save(update_fields=["status", "verification_data", "updated_at"])

        # Log the activity
        try:
            GlobalActivityLog.objects.create(
                action="PAYMENT_CONFIRMED",
                school=school,
                user=None,
                description=f"Paystack webhook confirmed payment {payment.reference} of {payment.amount}",
                metadata={
                    "payment_id": payment.id,
                    "gateway_reference": gateway_ref,
                    "amount": str(payment.amount),
                    "student": payment.student.names if payment.student else "N/A",
                },
            )
        except Exception as e:
            logger.error(f"Failed to log webhook activity: {e}")

        logger.info(f"Payment {payment.reference} marked as completed via webhook")
