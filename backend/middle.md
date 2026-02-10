To help your AI coding agent implement this correctly within your **Registra** project, you can provide it with the following technical specification. This explanation ensures it handles the subdomain extraction while respecting the proxy headers sent by **Coolify/Traefik**.

---

## Technical Instruction for AI Coding Agent

### Objective

Implement a custom Django middleware to extract the tenant subdomain from the `Host` header for a multi-tenant school management system.

### Step 1: Create the Middleware

In the `apps/tenants` directory (or your preferred core app), create `middleware.py`:

```python
from django.conf import settings

class TenantMiddleware:
    """
    Extracts the subdomain from the request host and attaches it to request.subdomain.
    Used for multi-tenancy identification in the Registra platform.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Use get_host() which respects USE_X_FORWARDED_HOST from Traefik
        host = request.get_host().split(':')[0].lower()
        domain_parts = host.split('.')

        # Logic for myregistra.net or www.myregistra.net
        # If parts > 2 (e.g., school1.myregistra.net), the first part is the tenant
        if len(domain_parts) > 2:
            subdomain = domain_parts[0]
            if subdomain in ['www', 'api', 'admin']:
                request.subdomain = None
            else:
                request.subdomain = subdomain
        else:
            request.subdomain = None

        return self.get_response(request)

```

### Step 2: Configure `settings.py`

The agent must update the configuration to trust the headers passed by the Traefik proxy and register the middleware.

1. **Trust Proxy Headers:**
* Set `USE_X_FORWARDED_HOST = True` so `get_host()` reads the tenant domain instead of the internal container IP.
* Set `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`.


2. **Register Middleware:**
* Add `'apps.tenants.middleware.TenantMiddleware'` to the `MIDDLEWARE` list. It should be placed after `django.middleware.common.CommonMiddleware`.


3. **Update `ALLOWED_HOSTS`:**
* Ensure `.myregistra.net` is included to permit all subdomains.



### Step 3: Implementation Verification

The agent should verify that:

* The middleware handles the "naked" domain (`myregistra.net`) by setting `request.subdomain` to `None`.
* The middleware ignores technical subdomains like `www` or `api`.
* All database queries can now be filtered using `request.subdomain`.

---

### Why this is necessary for Registra

Because your **Coolify** setup uses a wildcard `HostRegexp`, Traefik passes the original URL (e.g., `oxford.myregistra.net`) to the Django container. Without this middleware, Django treats every request as coming to the same application; with it, you can serve different school data based on that `request.subdomain` value.
