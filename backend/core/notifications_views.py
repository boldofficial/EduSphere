"""
Notification API Views

Handles SMS, WhatsApp, and bulk messaging via Termii.
"""
import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.tenant_utils import get_request_school
from core.notification_utils import get_termii_service, TermiiError

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_sms(request):
    """
    Send SMS to a phone number.
    
    POST /api/notifications/sms/
    Body: { "to": "+2349012345678", "message": "Hello" }
    """
    to = request.data.get("to")
    message = request.data.get("message")
    
    if not to or not message:
        return Response(
            {"error": "Missing required fields: to, message"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        termii = get_termii_service()
        result = termii.send_sms(to, message)
        return Response({"success": True, "data": result})
    except TermiiError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_whatsapp(request):
    """
    Send WhatsApp message.
    
    POST /api/notifications/whatsapp/
    Body: { "to": "+2349012345678", "message": "Hello" }
    """
    to = request.data.get("to")
    message = request.data.get("message")
    
    if not to or not message:
        return Response(
            {"error": "Missing required fields: to, message"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        termii = get_termii_service()
        result = termii.send_whatsapp(to, message)
        return Response({"success": True, "data": result})
    except TermiiError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_bulk_sms(request):
    """
    Send bulk SMS to multiple contacts.
    
    POST /api/notifications/bulk-sms/
    Body: { "contacts": ["+2349012345678", "+2348012345678"], "message": "Hello" }
    """
    contacts = request.data.get("contacts", [])
    message = request.data.get("message")
    
    if not contacts or not message:
        return Response(
            {"error": "Missing required fields: contacts (array), message"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        termii = get_termii_service()
        result = termii.send_bulk_sms(contacts, message)
        return Response({"success": True, "data": result})
    except TermiiError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_otp(request):
    """
    Send OTP to phone number.
    
    POST /api/notifications/otp/send/
    Body: { "phone": "+2349012345678", "channel": "sms" }
    """
    phone = request.data.get("phone")
    channel = request.data.get("channel", "sms")
    
    if not phone:
        return Response(
            {"error": "Missing required field: phone"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        termii = get_termii_service()
        result = termii.send_otp(phone, channel)
        return Response({
            "success": True,
            "pin_id": result.get("pin_id"),
            "message": result.get("message")
        })
    except TermiiError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_otp(request):
    """
    Verify OTP code.
    
    POST /api/notifications/otp/verify/
    Body: { "pin_id": "xxx", "pin": "1234" }
    """
    pin_id = request.data.get("pin_id")
    pin = request.data.get("pin")
    
    if not pin_id or not pin:
        return Response(
            {"error": "Missing required fields: pin_id, pin"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        termii = get_termii_service()
        verified = termii.verify_otp(pin_id, pin)
        return Response({"success": True, "verified": verified})
    except TermiiError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notification_balance(request):
    """Get Termii account balance."""
    try:
        termii = get_termii_service()
        result = termii.get_balance()
        return Response({"success": True, "balance": result})
    except TermiiError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)