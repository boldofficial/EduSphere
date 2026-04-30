import logging
import os
import re

from django.http import JsonResponse

logger = logging.getLogger(__name__)


class IPAccessControlMiddleware:
    """
    Middleware to restrict access by IP address.
    Configure ALLOWED_IPS environment variable as comma-separated list.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        allowed_ips = os.environ.get('ALLOWED_IPS', '')
        self.allowed_ips = [ip.strip() for ip in allowed_ips.split(',') if ip.strip()]
        self.exempt_paths = ['/health/', '/api/health/', '/api/public-settings/']

    def __call__(self, request):
        if not self.allowed_ips:
            return self.get_response(request)

        for exempt_path in self.exempt_paths:
            if request.path.startswith(exempt_path):
                return self.get_response(request)

        client_ip = self.get_client_ip(request)

        if client_ip not in self.allowed_ips:
            logger.warning(f"IP access denied: {client_ip} attempted to access {request.path}")
            return JsonResponse(
                {'error': 'Access denied from your IP address'},
                status=403
            )

        return self.get_response(request)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class SecurityHeadersMiddleware:
    """
    Add security headers to all responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.r2.dev https://*.supabase.co",
            "connect-src 'self' https://*.supabase.co https://api.paystack.co",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)

        return response


class RequestSizeLimitMiddleware:
    """
    Limit request body size to prevent DoS attacks.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.max_size = int(os.environ.get('MAX_REQUEST_SIZE_MB', 10)) * 1024 * 1024

    def __call__(self, request):
        content_length = request.META.get('CONTENT_LENGTH')

        if content_length and int(content_length) > self.max_size:
            logger.warning(f"Request size limit exceeded: {content_length} bytes from {request.META.get('REMOTE_ADDR')}")
            return JsonResponse(
                {'error': 'Request body too large'},
                status=413
            )

        return self.get_response(request)
