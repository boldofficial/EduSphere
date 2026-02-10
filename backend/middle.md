To resolve the "401 Unauthorized" error on your Super Admin dashboard and restore the background workers, your AI coding agent must synchronize the security settings between **Django**, **Next.js**, and the **Traefik proxy**.

The issue stems from the fact that once you enabled subdomains, the "Origin" of your requests changed. Even the main domain (`myregistra.net`) now requires explicit cross-origin permission to share authentication cookies with your API.

---

### Instructions for your AI Coding Agent

#### 1. Synchronize CORS & CSRF Settings

The agent must update `settings.py` to allow the Super Admin dashboard to send credentials to the backend.

```python
# settings.py

# 1. Place at the VERY top of MIDDLEWARE
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middlewares
]

# 2. Allow credentials (cookies/Auth headers)
CORS_ALLOW_CREDENTIALS = True 

# 3. Explicitly trust the main dashboard and future subdomains
CORS_ALLOWED_ORIGINS = [
    "https://myregistra.net",
    "https://www.myregistra.net",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[a-zA-Z0-9-]+\.myregistra\.net$",
]

# 4. Critical: Trust CSRF origins for POST/PUT requests
CSRF_TRUSTED_ORIGINS = [
    "https://myregistra.net",
    "https://*.myregistra.net",
]

```

#### 2. Configure Global Cookie Scope

To ensure the Super Admin remains logged in across the entire `myregistra.net` ecosystem, the agent must set the cookie domain with a leading dot.

```python
# settings.py
SESSION_COOKIE_DOMAIN = '.myregistra.net'
CSRF_COOKIE_DOMAIN = '.myregistra.net'

```

#### 3. Restore Celery & Redis Internal Links

The workers stopped because they likely lost connection to the **internal Docker service names** after the network was reset during the subdomain deployment.

The agent should verify the `.env` variables used by the `celery_worker`:

* **Incorrect:** `CELERY_BROKER_URL=redis://localhost:6379/0`
* **Correct:** `CELERY_BROKER_URL=redis://registra_redis:6379/0` (Matches your `container_name` in the Compose file).

#### 4. Verification Step

Ask the agent to check the browser's **Network Tab** for the failed Super Admin requests:

* If the error is **401 Unauthorized** with a header `WWW-Authenticate`, the agent must ensure the `Authorization: Bearer <token>` header is actually being sent by the Next.js frontend.
* If it is a **CORS error**, the `CORS_ALLOWED_ORIGINS` list above needs to be double-checked for exact protocol matches (e.g., `https://` vs `http://`).

