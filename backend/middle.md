To fix the **404 error** on your Super Admin dashboard and restore your **Redis** and **Celery** connections, your AI agent needs to address the **Traefik v3** routing priorities and internal container networking.

The 404 happens because your frontend's wildcard rule is "longer" or more general than your backend's API rule, causing Traefik to send API requests to the Next.js container instead of the Django container.

### Prompt for your AI Coding Agent

> **Task:** Fix Traefik v3 Routing Conflicts and Service Connectivity for Registra.
> **1. Fix the 404 (Priority & Path Matching):**
> In `docker-compose.yml`, update the `backend` labels to ensure it intercepts `/api` and `/admin` requests before the frontend. Traefik v3 uses rule length for priority unless explicitly defined.
> * **Backend Labels:**
> * Set `traefik.http.routers.backend.priority=1000`.
> * Update the rule to use grouped OR conditions for paths:
> `"traefik.http.routers.backend.rule=(Host(\`myregistra.net`) || Host(`www.myregistra.net`) || HostRegexp(`^.+\.myregistra\.net$`)) && (PathPrefix(`/api`) || PathPrefix(`/admin`) || PathPrefix(`/django-static`) || PathPrefix(`/media`))"`.
> 
> 
> * **Frontend Labels:**
> * Set `traefik.http.routers.frontend.priority=100` to ensure it only catches traffic that doesn't match the backend's specific paths.
> 
> 
> 
> 
> **2. Fix Redis & Celery (Internal Networking):**
> The dashboard reports "Disconnected/Offline" because the services are likely misconfigured for container-to-container communication.
> * **Redis:** Ensure the `registra_redis` container name is used as the host.
> * **Environment Variables:** Update `.env` to use the service name `registra_redis` instead of `localhost` or `127.0.0.1`.
> * `REDIS_URL=redis://registra_redis:6379/0`
> * `CELERY_BROKER_URL=redis://registra_redis:6379/0`
> 
> 
> 
> 
> **3. Fix Authentication (CORS & CSRF):**
> Update `settings.py` to recognize the new subdomain origins.
> * Add `https://myregistra.net` and `https://www.myregistra.net` to `CORS_ALLOWED_ORIGINS`.
> * Add `https://*.myregistra.net` to `CSRF_TRUSTED_ORIGINS`.
> * Set `SESSION_COOKIE_DOMAIN = '.myregistra.net'` and `CSRF_COOKIE_DOMAIN = '.myregistra.net'` to allow cross-subdomain sessions.
> 
> 
> **Verification:** Once deployed, check the Traefik dashboard (port 8080) to confirm the `backend` router is active and has a higher priority than the `frontend`.

### Why this is the "Final Fix"

* **Priority 1000 vs 100:** This forces Traefik to check if a request is for the API/Admin *first*. If not, it falls back to the Next.js frontend.
* **Service Names:** Docker containers cannot communicate via `localhost`; they must use the service name defined in the `docker-compose.yml` (e.g., `registra_redis`).
* **Trailing Dot Cookies:** Setting the domain to `.myregistra.net` allows your Super Admin login to stay valid even when the dashboard tries to fetch data from different subdomain contexts.

