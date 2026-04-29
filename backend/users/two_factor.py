"""
Two-Factor Authentication Views

Provides TOTP-based 2FA and backup code verification.
"""

import base64
import logging
import pyotp
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class TwoFactorSetupView(APIView):
    """
    Setup 2FA for a user.
    POST: Generate secret and QR code for user to scan
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Generate a new TOTP secret
        secret = pyotp.random_base32()
        
        # Store the secret temporarily (not activated until verified)
        user.two_factor_secret = secret
        user.save(update_fields=['two_factor_secret'])

        # Generate provisioning URI for authenticator apps
        # Format: otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="Registra"
        )

        # Generate backup codes
        backup_codes = user.generate_backup_codes()
        user.save(update_fields=['two_factor_backup_codes'])

        logger.info(f"2FA setup initiated for user {user.username}")

        return Response({
            "secret": secret,
            "qr_code": provisioning_uri,
            "backup_codes": backup_codes,
            "message": "Scan the QR code with your authenticator app, then verify with a code"
        })

    def delete(self, request):
        """Disable 2FA for the user"""
        user = request.user
        
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = []
        user.save(update_fields=['two_factor_enabled', 'two_factor_secret', 'two_factor_backup_codes'])

        logger.info(f"2FA disabled for user {user.username}")

        return Response({"message": "Two-factor authentication has been disabled"})


class TwoFactorVerifyView(APIView):
    """
    Verify and activate 2FA.
    POST: Verify the TOTP code and activate 2FA
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get('code', '')

        if not code:
            return Response(
                {"error": "Verification code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.two_factor_secret:
            return Response(
                {"error": "2FA has not been set up. Call setup first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the TOTP code
        totp = pyotp.TOTP(user.two_factor_secret)
        
        # Allow for time drift (valid within 1 window)
        is_valid = totp.verify(code) or totp.verify(str(int(code) - 1)) or totp.verify(str(int(code) + 1))

        if is_valid:
            user.two_factor_enabled = True
            user.save(update_fields=['two_factor_enabled'])
            
            logger.info(f"2FA activated for user {user.username}")
            
            return Response({
                "message": "Two-factor authentication has been enabled",
                "enabled": True
            })
        else:
            # Check if it's a backup code
            if user.verify_backup_code(code):
                logger.info(f"Backup code used for 2FA verification by {user.username}")
                return Response({
                    "message": "Verification successful (backup code)",
                    "enabled": user.two_factor_enabled
                })
            
            logger.warning(f"Invalid 2FA code attempt for user {user.username}")
            return Response(
                {"error": "Invalid verification code"},
                status=status.HTTP_400_BAD_REQUEST
            )


class TwoFactorLoginView(APIView):
    """
    Second step of login with 2FA.
    POST: Verify 2FA code after initial login
    """
    permission_classes = [IsAuthenticated]  # User must be authenticated via password

    def post(self, request):
        user = request.user
        code = request.data.get('code', '')

        if not code:
            return Response(
                {"error": "Verification code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.two_factor_enabled:
            return Response(
                {"error": "2FA is not enabled for this user"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the TOTP code
        totp = pyotp.TOTP(user.two_factor_secret)
        is_valid = totp.verify(code) or totp.verify(str(int(code) - 1)) or totp.verify(str(int(code) + 1))

        if is_valid:
            # Generate JWT tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            logger.info(f"2FA login successful for user {user.username}")
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "Login successful"
            })
        else:
            # Check backup code
            if user.verify_backup_code(code):
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(user)
                
                logger.info(f"2FA login via backup code for user {user.username}")
                
                return Response({
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "message": "Login successful (backup code)"
                })
            
            logger.warning(f"Invalid 2FA code during login for user {user.username}")
            return Response(
                {"error": "Invalid verification code"},
                status=status.HTTP_400_BAD_REQUEST
            )


class TwoFactorStatusView(APIView):
    """
    Get 2FA status for current user.
    GET: Check if 2FA is enabled
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        return Response({
            "enabled": user.two_factor_enabled,
            "has_backup_codes": len(user.two_factor_backup_codes or []) > 0,
            "backup_codes_count": len(user.two_factor_backup_codes or [])
        })


class TwoFactorRegenerateBackupCodesView(APIView):
    """
    Regenerate backup codes.
    POST: Generate new backup codes (invalidates old ones)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        if not user.two_factor_enabled:
            return Response(
                {"error": "2FA must be enabled to regenerate backup codes"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new backup codes
        backup_codes = user.generate_backup_codes()
        user.save(update_fields=['two_factor_backup_codes'])

        logger.info(f"Backup codes regenerated for user {user.username}")

        return Response({
            "backup_codes": backup_codes,
            "message": "New backup codes generated. Store them securely."
        })