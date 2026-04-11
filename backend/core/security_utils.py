import logging
import os
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class TenantRequiredMixin:
    """
    Mixin to ensure tenant isolation is enforced on views.
    Returns 403 if tenant cannot be identified.
    """

    def dispatch(self, request, *args, **kwargs):
        tenant = getattr(request, 'tenant', None)
        subdomain = getattr(request, 'subdomain', None)

        if not tenant and not subdomain:
            from rest_framework.response import Response
            from rest_framework import status
            logger.warning(f"Tenant not identified for request to {request.path}")
            return Response(
                {'error': 'Tenant identification required. Please access through your school domain.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().dispatch(request, *args, **kwargs)


class TenantIsolationMixin:
    """
    Mixin to ensure users can only access data within their tenant.
    Must be used with views that have request.tenant set.
    """

    def get_queryset(self):
        from rest_framework.exceptions import PermissionDenied
        
        queryset = super().get_queryset()
        
        if not hasattr(self.request, 'tenant') or not self.request.tenant:
            logger.warning(f"Tenant isolation bypass attempt by {self.request.user.email}")
            raise PermissionDenied("Tenant context required for this operation.")
        
        if hasattr(queryset, 'filter'):
            return queryset.filter(school=self.request.tenant)
        
        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        
        if not hasattr(self.request, 'tenant') or not self.request.tenant:
            raise PermissionDenied("Tenant context required for this operation.")
        
        if serializer.Meta.model == 'school':
            return serializer.save()
        
        serializer.save(school=self.request.tenant)


SENSITIVE_FIELDS: List[str] = [
    'password',
    'token',
    'secret',
    'api_key',
    'apikey',
    'access_key',
    'secret_key',
    'authorization',
    'credential',
    'private_key',
    'session',
    'csrf',
    'xsrf',
]


def sanitize_log_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove sensitive information from data before logging.
    """
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    for key, value in data.items():
        key_lower = key.lower()
        
        if any(sensitive in key_lower for sensitive in SENSITIVE_FIELDS):
            sanitized[key] = '***REDACTED***'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_log_data(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


def sanitize_ai_prompt(user_input: str) -> str:
    """
    Sanitize user input to prevent prompt injection attacks.
    Removes or escapes potentially dangerous patterns.
    """
    dangerous_patterns = [
        r'ignore\s+(previous|all|above)',
        r'disregard\s+(previous|all|above|instructions)',
        r'(?:forget|ignore)\s+instructions',
        r'(?:you\s+are|you\s+are now)',
        r'(?:system\s+prompt|system\s+message)',
        r'^#\s*instructions',
        r'^#\s*system',
        r'^\(system\)',
        r'^\[system\]',
        r'now\s+you\s+are\s+a',
        r'pretend\s+to\s+be',
        r'always\s+say\s+yes',
        r'cannot\s+refuse',
        r'do\s+not\s+refuse',
    ]
    
    sanitized = user_input
    
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '[FILTERED]', sanitized, flags=re.IGNORECASE)
    
    sanitized = sanitized.replace('```system', '```text')
    sanitized = sanitized.replace('```SYSTEM', '```text')
    
    max_length = 2000
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + '\n\n[Truncated due to length]'
    
    return sanitized


def validate_file_upload(file, allowed_extensions: Optional[List[str]] = None) -> bool:
    """
    Validate file uploads for security.
    Returns True if valid, raises ValidationError otherwise.
    """
    from rest_framework.exceptions import ValidationError
    
    if allowed_extensions is None:
        allowed_extensions = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx', 'txt']
    
    filename = file.name if hasattr(file, 'name') else str(file)
    
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    if ext not in allowed_extensions:
        raise ValidationError({
            'detail': f'File type .{ext} is not allowed. Allowed types: {", ".join(allowed_extensions)}'
        })
    
    max_size = 10 * 1024 * 1024
    if hasattr(file, 'size') and file.size > max_size:
        raise ValidationError({'detail': 'File size exceeds 10MB limit'})
    
    return True


def check_ip_allowed(request) -> bool:
    """
    Check if request IP is in the allowed list.
    Returns True if allowed or no allowlist configured.
    """
    allowed_ips = os.environ.get('ALLOWED_IPS', '')
    
    if not allowed_ips:
        return True
    
    allowed_ip_list = [ip.strip() for ip in allowed_ips.split(',') if ip.strip()]
    
    client_ip = request.META.get('REMOTE_ADDR')
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(',')[0].strip()
    
    if client_ip not in allowed_ip_list:
        logger.warning(f"Blocked request from disallowed IP: {client_ip}")
        return False
    
    return True
