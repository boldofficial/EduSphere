Task: Fix syntax errors in Traefik v3 labels for Registra.

1. Update Backend Labels: Replace the current backend labels with this syntax (separating PathPrefixes):

YAML
- "traefik.http.routers.backend.rule=(Host(`myregistra.net`) || Host(`www.myregistra.net`) || HostRegexp(`^.+\\.myregistra\\.net$`)) && (PathPrefix(`/api`) || PathPrefix(`/admin`) || PathPrefix(`/django-static`) || PathPrefix(`/media`))"
- "traefik.http.routers.backend.tls.certresolver=letsencrypt"  # VERIFY NAME IN PROXY CONFIG
- "traefik.http.routers.backend.priority=1000"
2. Update Frontend Labels:

YAML
- "traefik.http.routers.frontend.rule=Host(`myregistra.net`) || Host(`www.myregistra.net`) || HostRegexp(`^.+\\.myregistra\\.net$`)"
- "traefik.http.routers.frontend.tls.certresolver=letsencrypt" # VERIFY NAME IN PROXY CONFIG
- "traefik.http.routers.frontend.priority=100"
3. Fix Service Names for Redis/Celery: To fix "Redis Disconnected," the agent must ensure the .env uses the internal container names visible in docker ps:

REDIS_URL=redis://redis-rckswgkwswcck0gokswk0s8s-164122194018:6379/0

Better yet, in the Compose file, set a fixed container_name: registra_redis for the redis service so the name doesn't change.