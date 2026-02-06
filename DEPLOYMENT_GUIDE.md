# Registra - Hostinger VPS Deployment Guide

This guide describes how to deploy the Registra (EduSphere) platform to your new VPS using the Docker Compose setup we generated.

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
*Note: You may need to stop the nginx container temporarily during cert generation if using standalone mode.*

## Troubleshooting
- **Check Logs**: `sudo docker-compose logs -f [service_name]`
- **Restart Services**: `sudo docker-compose restart`
- **Rebuild after code changes**: `sudo docker-compose up -d --build`

## Data Migration (Optional)
To import your existing database:
```bash
cat backup.sql | sudo docker-compose exec -T db psql -U registra_admin -d registra_db
```
