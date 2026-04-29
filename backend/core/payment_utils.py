"""
Paystack Payment Gateway Integration

Handles:
- Initialize payment
- Verify transaction
- Webhook handling
"""
import logging
import time
import hashlib
from decimal import Decimal
from typing import Optional

from django.conf import settings
from django.db import transaction
import requests

logger = logging.getLogger(__name__)


class PaystackError(Exception):
    """Paystack API error."""
    pass


class PaystackService:
    """
    Paystack payment service for Nigerian schools.
    Supports card payments, bank transfers, and USSD.
    """
    
    BASE_URL = "https://api.paystack.co"
    TEST_URL = "https://api.paystack.co"  # Same URL, test mode via key
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.public_key = settings.PAYSTACK_PUBLIC_KEY
        self.test_mode = settings.PAYSTACK_TEST_MODE
        self.reference_prefix = settings.PAYSTACK_REFERENCE_PREFIX
        self.webhook_secret = settings.PAYSTACK_WEBHOOK_SECRET
        
        if not self.secret_key:
            logger.warning("Paystack secret key not configured")
    
    def _headers(self) -> dict:
        """Return headers for Paystack API requests."""
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
    
    def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make API request to Paystack."""
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self._headers(), params=data)
            else:
                response = requests.request(method, url, headers=self._headers(), json=data)
            
            result = response.json()
            
            if not result.get("status"):
                logger.error(f"Paystack API error: {result}")
                raise PaystackError(result.get("message", "Unknown error"))
            
            return result.get("data", {})
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack request failed: {e}")
            raise PaystackError(f"Connection failed: {str(e)}")
    
    def generate_reference(self, school_id: int, student_id: int, term: str) -> str:
        """Generate unique payment reference."""
        timestamp = int(time.time())
        data = f"{school_id}-{student_id}-{term}-{timestamp}"
        hash_obj = hashlib.sha256(data.encode())
        short_hash = hash_obj.hexdigest()[:8].upper()
        return f"{self.reference_prefix}{short_hash}{timestamp}"
    
    def initialize_payment(
        self,
        email: str,
        amount: float,  # Amount in Naira
        reference: str,
        callback_url: str,
        metadata: dict = None,
        name: str = "",
        phone: str = "",
        bank_transfer: bool = False,
        ussd: bool = False,
        card: bool = True,
    ) -> dict:
        """
        Initialize a payment transaction.
        
        Args:
            email: Customer email
            amount: Amount in Naira (not kobo)
            reference: Unique reference for this transaction
            callback_url: URL to redirect after payment
            metadata: Additional data to store with transaction
            name: Customer name
            phone: Customer phone number
            bank_transfer: Enable bank transfer option
            ussd: Enable USSD option
            card: Enable card payment (default)
        
        Returns:
            Payment authorization URL and reference
        """
        if not self.secret_key:
            raise PaystackError("Paystack not configured")
        
        # Convert to kobo (Paystack uses kobo, not naira)
        amount_kobo = int(Decimal(str(amount)) * 100)
        
        channels = []
        if card:
            channels.append("card")
        if bank_transfer:
            channels.append("bank")
        if ussd:
            channels.append("ussd")
        
        data = {
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
            "callback_url": callback_url,
            "channels": channels if channels else ["card"],
            "currency": "NGN",
        }
        
        if metadata:
            data["metadata"] = metadata
        
        if name:
            data["metadata"] = {**(metadata or {}), "customer_name": name}
        
        if phone:
            data["metadata"] = {**(data.get("metadata", {})), "customer_phone": phone}
        
        logger.info(f"Initializing Paystack payment: {reference}, NGN {amount}")
        
        return self._request("POST", "transaction/initialize", data)
    
    def verify_payment(self, reference: str) -> dict:
        """
        Verify a payment transaction by reference.
        
        Returns transaction details including status.
        """
        if not self.secret_key:
            raise PaystackError("Paystack not configured")
        
        logger.info(f"Verifying Paystack payment: {reference}")
        
        return self._request("GET", f"transaction/verify/{reference}")
    
    def get_transaction(self, transaction_id: int) -> dict:
        """Get transaction details by ID."""
        return self._request("GET", f"transaction/{transaction_id}")
    
    def charge_authorization(
        self,
        authorization_code: str,
        amount: float,
        email: str,
        reference: str,
        metadata: dict = None,
    ) -> dict:
        """
        Charge a customer using saved authorization.
        Useful for recurring payments (e.g., installment plans).
        """
        amount_kobo = int(Decimal(str(amount)) * 100)
        
        data = {
            "authorization_code": authorization_code,
            "amount": amount_kobo,
            "email": email,
            "reference": reference,
            "currency": "NGN",
        }
        
        if metadata:
            data["metadata"] = metadata
        
        return self._request("POST", "transaction/charge_authorization", data)
    
    def list_banks(self, country: str = "nigeria") -> list:
        """List supported banks."""
        data = self._request("GET", "bank", {"country": country})
        return data.get("banks", [])
    
    def resolve_account_number(self, account_number: str, bank_code: str) -> dict:
        """
        Verify Nigerian bank account (for bank transfer payments).
        
        Args:
            account_number: The account number to verify
            bank_code: The bank's NIP code
        """
        return self._request(
            "GET",
            "bank/resolve",
            {"account_number": account_number, "bank_code": bank_code}
        )
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
        """
        Verify Paystack webhook signature.
        
        Paystack sends signature in header 'X-Paystack-Signature'
        """
        import hmac
        import hashlib
        
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return expected_signature == signature


def get_paystack_service() -> PaystackService:
    """Get Paystack service instance."""
    return PaystackService()