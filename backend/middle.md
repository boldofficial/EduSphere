Task: Fix Traefik v3 Configuration and Internal Networking for Registra.

1. Fix the Certificate Resolver Name: The docker inspect logs confirm the resolver name is letsencrypt.

Action: Update all certresolver labels in docker-compose.yml from letsencrypt-dns to letsencrypt.

2. Clean Up Router Rules (Traefik v3 Syntax): Traefik is rejecting the current rules due to manual HostSNI usage and incorrect PathPrefix formatting.

Action: Remove any labels containing HostSNI.

Action: Use this exact rule for the backend to ensure /api and /admin are correctly intercepted with high priority: "traefik.http.routers.backend.rule=(Host(\myregistra.net`) || Host(`www.myregistra.net`) || HostRegexp(`^.+\.myregistra\.net$`)) && (PathPrefix(`/api`) || PathPrefix(`/admin`) || PathPrefix(`/django-static`) || PathPrefix(`/media`))"`

Action: Set traefik.http.routers.backend.priority=1000 and traefik.http.routers.frontend.priority=100.

3. Restore Redis & Celery Connectivity: The "Disconnected" status is due to the backend using incorrect container names.

Action: In the docker-compose.yml, set fixed container names:

container_name: registra_redis for the redis service.

container_name: registra_db for the db service.

Action: Update the .env file to use these exact names:

REDIS_URL=redis://registra_redis:6379/0.

DATABASE_URL (or equivalent) should use registra_db as the host.