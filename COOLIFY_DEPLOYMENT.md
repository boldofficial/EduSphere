# Deploying Registra with Coolify (Hostinger VPS)

Coolify is an excellent choice for managing your Docker-based deployment. It provides a beautiful UI for SSL management, environment variables, and automated deployments from GitHub.

## 1. Install Coolify on VPS
Log into your Hostinger VPS and run:
```bash
curl -fsSL https://get.coollabs.io | bash
```
Once installed, access the UI at `http://your-vps-ip:8000`.

## 2. Create a New Project
1.  Click **Projects** -> **Create New Project**.
2.  Click **Environments** -> **Production**.
3.  Click **New Resource** -> **Docker Compose**.

## 3. Configure the Repository
1.  Connect your GitHub/GitLab account.
2.  Select the `ng-school-management-system` repository.
3.  Select the **main** branch.
4.  Coolify will automatically detect the `docker-compose.yml` in the root.

## 4. Wildcard Subdomain Configuration
For your multi-tenant setup (`*.myregistra.net`):
1.  In the Coolify resource settings, find the **FQDN** field.
2.  Set it to `https://myregistra.net, https://*.myregistra.net`.
3.  Coolify will automatically provision a wildcard SSL certificate using Let's Encrypt (DNS-01 challenge might be required depending on your provider, but often HTTP-01 works for subdomains if pointed correctly).

## 5. Environment Variables
Copy the variables from your `.env.template` into the **Environment Variables** tab in Coolify.
> [!TIP]
> Use the **Bulk Edit** feature in Coolify to paste everything at once.

## 6. Docker Compose Service Mapping
Since we have an `nginx` service in our `docker-compose.yml`, Coolify's internal proxy (Traefik) should point to it.
1.  In the **Services** list in Coolify, find the `nginx` service.
2.  Ensure it is the one exposed to the public domain.

## 7. PostgreSQL & Persistent Data
Coolify handles Docker volumes (`postgres_data`, etc.) automatically. You can view them in the **Storage** tab.

## Deployment Checklist
- [ ] Point A record and Wildcard CNAME to VPS IP.
- [ ] Fill in all keys in the Environment Variables tab.
- [ ] Ensure `DJANGO_API_URL` is set to `http://backend:8000` (Internal Docker network).
- [ ] Click **Deploy**.
