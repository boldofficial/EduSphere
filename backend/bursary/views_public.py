import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from bursary.models import Payment, PaymentLineItem
from schools.models import SchoolPaymentConfig

logger = logging.getLogger(__name__)


class PublicInvoiceView(APIView):
    """
    Public endpoint to retrieve payment/invoice details using a secret hash.
    No authentication required — the UUID hash acts as a capability token.

    GET /api/public/invoice/<payment_hash>/
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # Explicitly disable auth

    def get(self, request, payment_hash):
        try:
            payment = Payment.objects.select_related(
                "student", "student__current_class", "category", "school"
            ).get(payment_hash=payment_hash)
        except Payment.DoesNotExist:
            return Response({"error": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)

        school = payment.school

        # Get school's payment config for checkout info
        paystack_public_key = None
        pass_fee = False
        try:
            config = SchoolPaymentConfig.objects.get(school=school)
            if config.enable_paystack:
                paystack_public_key = config.paystack_public_key
            pass_fee = config.pass_processing_fee_to_parents
        except SchoolPaymentConfig.DoesNotExist:
            pass

        # Build line items
        line_items = list(
            PaymentLineItem.objects.filter(payment=payment).values("purpose", "amount")
        )

        data = {
            "payment_hash": str(payment.payment_hash),
            "reference": payment.reference,
            "status": payment.status,
            "amount": str(payment.amount),
            "date": str(payment.date),
            "session": payment.session,
            "term": payment.term,
            "method": payment.method,
            "remark": payment.remark,
            "student_name": payment.student.names if payment.student else "N/A",
            "student_class": (
                payment.student.current_class.name
                if payment.student and payment.student.current_class
                else "N/A"
            ),
            "category": payment.category.name if payment.category else "General",
            "line_items": line_items,
            "school": {
                "name": school.name,
                "logo": school.logo,
                "email": school.email,
                "phone": school.phone,
            },
            "checkout": {
                "paystack_public_key": paystack_public_key,
                "pass_processing_fee_to_parents": pass_fee,
            },
        }

        return Response(data)
