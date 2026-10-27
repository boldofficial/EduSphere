# Registra - Hostinger VPS Deployment Guide

This guide describes how to deploy the Registra platform to your new VPS using the Docker Compose setup we generated.

## Prerequisites

1.  **Server**: A Hostinger VPS running Ubuntu (22.04+ recommended).
2.  **Tools**: Install Docker and Docker Compose on the VPS.
    ```bash
    # Quick install
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```
3.  **DNS**: Point `myregistra.net` and `*.myregistra.net` (A record) to your VPS IP address.

## Deployment Steps

### 1. Transfer Code

Clone your repository or upload the files to your VPS `/home/user/registra` directory.

### 2. Configure Environment

Copy the template and fill in your real credentials:

```bash
cp .env.template .env
nano .env
```

> [!IMPORTANT]
> Change `POSTGRES_PASSWORD` and `DJANGO_SECRET_KEY` to something unique and secure.

### 3. Build and Start Services

Run the following command to build the images and start the containers in detached mode:

```bash
sudo docker-compose up -d --build
```

### 4. Initialize Database

Run migrations inside the backend container:

```bash
sudo docker-compose exec backend python manage.py migrate
sudo docker-compose exec backend python manage.py collectstatic --noinput
```

### 5. Create Admin Account

```bash
sudo docker-compose exec backend python manage.py createsuperuser
```

### 6. SSL Setup (Let's Encrypt)

Since the `nginx.conf` expects SSL certs at `/etc/letsencrypt/`, you can use Certbot to generate them on the host:

```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d myregistra.net -d *.myregistra.net
```

_Note: You may need to stop the nginx container temporarily during cert generation if using standalone mode._

### 7. Customer Custom Domains

The wildcard certificate for `*.myregistra.net` does not cover school-owned domains. Configure Cloudflare for SaaS before enabling custom domains in production:

1. Enable Custom Hostnames on the `myregistra.net` zone.
2. Create a proxied fallback origin that reaches the Registra frontend.
3. Create `customers.myregistra.net` as the customer CNAME target and point it to the fallback origin.
4. Ensure the edge/origin router accepts verified customer Host headers and forwards them unchanged to Next.js.
5. Set `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_SAAS_ZONE_ID`, and `CUSTOM_DOMAIN_CNAME_TARGET` in the backend environment.

Restrict the API token to Custom Hostnames access for this zone. The application activates a school hostname only after Cloudflare reports both the hostname and its certificate as active.

## Troubleshooting

- **Check Logs**: `sudo docker-compose logs -f [service_name]`
- **Restart Services**: `sudo docker-compose restart`
- **Rebuild after code changes**: `sudo docker-compose up -d --build`

## Data Migration (Optional)

To import your existing database:

```bash
cat backup.sql | sudo docker-compose exec -T db psql -U registra_admin -d registra_db
```
