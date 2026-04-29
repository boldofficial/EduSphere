"""
Termii SMS & WhatsApp Notification Service

Handles:
- SMS sending
- WhatsApp messaging
- Bulk messaging
- OTP/verification codes
"""
import logging
from typing import Optional

from django.conf import settings
import requests

logger = logging.getLogger(__name__)


class TermiiError(Exception):
    """Termii API error."""
    pass


class TermiiService:
    """
    Termii notification service for Nigerian schools.
    Supports SMS and WhatsApp messaging.
    """
    
    BASE_URL = "https://api.termii.com"
    
    def __init__(self):
        self.api_key = settings.TERMII_API_KEY
        self.sender_id = settings.TERMII_SENDER_ID or "EDUSPH"
        self.channel = settings.TERMII_CHANNEL  # dnd, sms, whatsapp
        
        if not self.api_key:
            logger.warning("Termii API key not configured")
    
    def _request(self, endpoint: str, data: dict) -> dict:
        """Make API request to Termii."""
        url = f"{self.BASE_URL}/{endpoint}"
        full_data = {**data, "api_key": self.api_key}
        
        try:
            response = requests.post(url, json=full_data, timeout=30)
            result = response.json()
            
            if not result.get("code") == "OK":
                logger.error(f"Termii API error: {result}")
                raise TermiiError(result.get("message", "Unknown error"))
            
            return result
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Termii request failed: {e}")
            raise TermiiError(f"Connection failed: {str(e)}")
    
    def send_sms(
        self,
        to: str,
        message: str,
        channel: str = None,
    ) -> dict:
        """
        Send SMS to a phone number.
        
        Args:
            to: Phone number (e.g., +2349012345678 or 09012345678)
            message: SMS content
            channel: sms, dnd, or whatsapp (default from settings)
        """
        if not self.api_key:
            raise TermiiError("Termii not configured")
        
        # Format phone number
        phone = self._format_phone(to)
        
        data = {
            "to": phone,
            "sms": message,
            "from": self.sender_id,
            "type": "plain",
            "channel": channel or self.channel,
        }
        
        logger.info(f"Sending SMS to {phone}")
        return self._request("api/sms/send", data)
    
    def send_whatsapp(
        self,
        to: str,
        message: str,
    ) -> dict:
        """Send WhatsApp message."""
        if not self.api_key:
            raise TermiiError("Termii not configured")
        
        phone = self._format_phone(to)
        
        data = {
            "to": phone,
            "from": self.sender_id,
            "message": message,
        }
        
        logger.info(f"Sending WhatsApp to {phone}")
        return self._request("api/whatsapp/send", data)
    
    def send_bulk_sms(
        self,
        contacts: list,
        message: str,
    ) -> dict:
        """
        Send bulk SMS to multiple contacts.
        
        Args:
            contacts: List of phone numbers
            message: SMS content
        """
        if not self.api_key:
            raise TermiiError("Termii not configured")
        
        # Format all phones
        phones = [self._format_phone(p) for p in contacts]
        
        data = {
            "to": phones,
            "sms": message,
            "from": self.sender_id,
            "type": "plain",
            "channel": self.channel,
        }
        
        logger.info(f"Sending bulk SMS to {len(phones)} contacts")
        return self._request("api/sms/send/bulk", data)
    
    def send_otp(
        self,
        phone: str,
        channel: str = "sms",
    ) -> dict:
        """
        Send one-time password (OTP).
        
        Args:
            phone: Phone number
            channel: sms, whatsapp, or voice
        
        Returns:
            Contains pin_id for verification
        """
        if not self.api_key:
            raise TermiiError("Termii not configured")
        
        phone = self._format_phone(phone)
        
        data = {
            "phone_number": phone,
            "channel": channel,
            "pin_type": "NUMERIC",
            "pin_length": 4,
        }
        
        logger.info(f"Sending OTP to {phone}")
        return self._request("api/otp/send", data)
    
    def verify_otp(
        self,
        pin_id: str,
        pin: str,
    ) -> bool:
        """
        Verify OTP code.
        
        Args:
            pin_id: The ID returned from send_otp
            pin: The OTP code entered by user
        
        Returns:
            True if valid, False otherwise
        """
        if not self.api_key:
            raise TermiiError("Termii not configured")
        
        try:
            result = self._request("api/otp/verify", {
                "pin_id": pin_id,
                "pin": pin,
            })
            return result.get("verified", False)
        except TermiiError:
            return False
    
    def _format_phone(self, phone: str) -> str:
        """
        Format Nigerian phone number to international format.
        +2349012345678
        """
        # Remove all non-digits
        digits = "".join(c for c in phone if c.isdigit())
        
        # Already international format
        if digits.startswith("234"):
            return f"+{digits}"
        
        # Starts with 0 (e.g., 09012345678)
        if digits.startswith("0"):
            return f"+234{digits[1:]}"
        
        # Just the number (e.g., 9012345678)
        if len(digits) == 10:
            return f"+234{digits}"
        
        # Already has + but not 234
        if phone.startswith("+"):
            return phone
        
        return f"+{digits}"
    
    def get_balance(self) -> dict:
        """Get account balance."""
        if not self.api_key:
            raise TermiiError("Termii not configured")
        
        return self._request("api/get-balance", {})


def get_termii_service() -> TermiiService:
    """Get Termii service instance."""
    return TermiiService()