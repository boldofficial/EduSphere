import logging
from schools.models import School
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 1. Get tenant identifier from header (set by Next.js middleware)
        tenant_domain = request.headers.get('X-Tenant-ID')
        
        # DEBUG LOGGING - Using logger
        logger.info(f"[TENANT_DEBUG] Host: {request.get_host()}, X-Tenant-ID Header: {tenant_domain}")

        # 2. Fallback for Local Dev / No Header (e.g. direct API calls)
        from django.conf import settings
        root_domain = getattr(settings, 'ROOT_DOMAIN', 'myregistra.net')
        root_host = root_domain.split(':')[0]

        if not tenant_domain:
            host = request.get_host().split(':')[0]
            if host != root_host and host.endswith(f".{root_host}"):
                tenant_domain = host.replace(f".{root_host}", "")
            elif host != root_host and host != '127.0.0.1' and host != 'localhost':
                # Might be a custom domain
                tenant_domain = host

        if tenant_domain and tenant_domain != 'www' and tenant_domain != root_host:
            try:
                # Lookup by subdomain (slug) or custom domain
                from django.db.models import Q
                request.tenant = School.objects.filter(
                    Q(domain=tenant_domain) | Q(custom_domain=tenant_domain)
                ).first()
                if request.tenant:
                    logger.info(f"[TENANT_DEBUG] Found Tenant: {request.tenant.domain}")
                else:
                    logger.warning(f"[TENANT_DEBUG] No tenant found for domain: {tenant_domain}")
                # Also set back to tenant_domain for consistency in serializer checks
                request.tenant_id = tenant_domain
            except Exception as e:
                logger.error(f"Tenant lookup error: {e}")

        # If no tenant found and we're not on a known system domain, 
        # it might be a custom domain not in our DB yet or a malformed request
        return None

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only log mutations (POST, PUT, PATCH, DELETE)
        if request.user.is_authenticated and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Skip standard mutation logging for auth routes to avoid double-logging or credential leaks
            if '/token/' in request.path or '/login/' in request.path:
                pass
            else:
                self._log_activity(request, response)

        # Log SUCCESSFUL login attempts
        if hasattr(response, 'status_code') and response.status_code in [200, 201]:
             if '/token/' in request.path or '/login/' in request.path:
                 self._log_activity(request, response)

        # Log FAILED login attempts (Brute force detection)
        if hasattr(response, 'status_code') and response.status_code in [401, 403]:
             if '/token/' in request.path or '/login/' in request.path:
                 # Log without user info (since they failed) but capture IP/Path
                 self._log_activity(request, response, force_anonymous=True)

        return response

    def _log_activity(self, request, response, force_anonymous=False):
        try:
            from core.models import GlobalActivityLog
            
            user = request.user if request.user.is_authenticated and not force_anonymous else None
            school = getattr(request, 'tenant', None)
            
            # Don't log if we can't identify context and it's 200 OK (noise)
            if not user and response.status_code < 400:
                return

            GlobalActivityLog.objects.create(
                action='RECORDS_MUTATED' if response.status_code < 400 else 'ACCESS_DENIED',
                school=school,
                user=user,
                description=f"{request.method} request to {request.path}",
                metadata={
                    'path': request.path,
                    'method': request.method,
                    'status': response.status_code,
                    'ip': self.get_client_ip(request),
                    # explicitly NO body logging for auth
                }
            )
        except Exception as e:
            print(f"Audit log error: {e}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
