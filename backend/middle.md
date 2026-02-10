To resolve the persistent **404 error** and restore your **Redis** and **Celery** connections, your AI agent must address the **Traefik v3** routing priorities and internal container networking.

The 404 error on your dashboard indicates that Traefik is failing to match the incoming request to your backend service, likely because the frontend's wildcard rule is "stealing" the traffic intended for the API.

### Final Implementation Prompt for AI Coding Agent

> **Task:** Fix Traefik v3 Routing Conflicts and Restore Registra Internal Services.
> **1. Fix the 404 (Explicit Priorities & Path Matching):**
> In `docker-compose.yml`, update the `backend` labels to ensure it intercepts `/api` and `/admin` requests before the frontend catch-all.
> * **Backend Labels:**
> * Add `traefik.http.routers.backend.priority=1000` to give the backend higher precedence.
> * Update the rule to use grouped OR conditions for paths:
> `"traefik.http.routers.backend.rule=(Host(\`myregistra.net`) || Host(`www.myregistra.net`) || HostRegexp(`^.+\.myregistra\.net$`)) && (PathPrefix(`/api`) || PathPrefix(`/admin`) || PathPrefix(`/django-static`) || PathPrefix(`/media`))"`.
> 
> 
> * **Frontend Labels:**
> * Add `traefik.http.routers.frontend.priority=100`.
> 
> 
> 
> 
> **2. Restore Redis & Celery (Internal DNS Resolution):**
> The dashboard reports "Disconnected/Offline" because services cannot resolve `localhost` within the Docker bridge.
> * **Update Environment Variables:**
> * Set `REDIS_URL=redis://registra_redis:6379/0`.
> * Set `CELERY_BROKER_URL=redis://registra_redis:6379/0`.
> * (Verify these match the `container_name: registra_redis` in your Compose file).
> 
> 
> 
> 
> **3. Fix Authentication (CORS & CSRF):**
> Update `settings.py` to recognize requests from both the main domain and dynamic subdomains.
> * Add `https://myregistra.net` and `https://www.myregistra.net` to `CORS_ALLOWED_ORIGINS`.
> * Add `https://*.myregistra.net` to `CSRF_TRUSTED_ORIGINS`.
> * Set `SESSION_COOKIE_DOMAIN = '.myregistra.net'` and `CSRF_COOKIE_DOMAIN = '.myregistra.net'`.
> 
> 
> **4. Validation:**
> After redeploying, verify that `docker logs coolify-proxy` does not show "unexpected number of parameters" for the backend router.

### Critical Checklist for the Agent:

* **Traefik Version:** Ensure you are using a Traefik v3.6+ image if possible, as it contains critical fixes for Docker API mismatches that cause 503/404 errors.
* **Forwarding Headers:** Ensure `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` is present in `settings.py` to prevent CSRF verification failures during the login process.
* **Port Mapping:** Ensure `traefik.http.services.backend.loadbalancer.server.port=8000` is explicitly set so Traefik knows which internal port to hit.

