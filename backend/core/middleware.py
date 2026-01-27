from schools.models import School
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 1. Get tenant identifier from header (set by Next.js middleware)
        tenant_domain = request.headers.get('X-Tenant-ID')
        
        # 2. Fallback for Local Dev / No Header (e.g. direct API calls)
        from django.conf import settings
        root_domain = getattr(settings, 'ROOT_DOMAIN', 'localhost:3000')
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
                # Also set back to tenant_domain for consistency in serializer checks
                request.tenant_id = tenant_domain
            except Exception as e:
                print(f"Tenant lookup error: {e}")

        # If no tenant found and we're not on a known system domain, 
        # it might be a custom domain not in our DB yet or a malformed request
        return None

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only log mutations (POST, PUT, PATCH, DELETE) for authenticated users
        if request.user.is_authenticated and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Avoid logging login/token routes to prevent storing passwords or sensitive tokens in logs
            if '/token/' in request.path or '/login/' in request.path:
                return response

            from core.models import GlobalActivityLog
            from django.contrib.contenttypes.models import ContentType
            import json

            # Simple audit logging
            try:
                # We skip GET and only log successful or potentially impactful mutations
                if 200 <= response.status_code < 400:
                    GlobalActivityLog.objects.create(
                        action='RECORDS_MUTATED',
                        school=getattr(request, 'tenant', None),
                        user=request.user,
                        description=f"{request.method} request to {request.path}",
                        metadata={
                            'path': request.path,
                            'method': request.method,
                            'status': response.status_code,
                            'ip': self.get_client_ip(request),
                        }
                    )
            except Exception as e:
                # Middleware should never crash the request
                print(f"Audit log error: {e}")

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
