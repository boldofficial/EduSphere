#!/bin/bash

# ============================================
# sync-prod-to-local.sh
# Syncs production database to local Docker
# Usage: bash sync-prod-to-local.sh
# ============================================

# --- CONFIG ---
SERVER_IP="72.62.160.70"
SERVER_USER="root"
PROD_CONTAINER="db-rckswgkwswcck0gokswk0s8s-120054959616"
DB_NAME="registra_db"
DB_USER="registra_admin"
BACKUP_FILE="$HOME/registra_backup.sql"
LOCAL_CONTAINER="registra_db"
COMPOSE_FILE="docker-compose.local.yml"

# --- COLORS ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "============================================"
echo "   registra_db — Sync Production to Local"
echo "============================================"
echo ""

# --- STEP 1: Dump production database ---
echo -e "${YELLOW}[1/5] Dumping production database from server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "docker exec ${PROD_CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} > /root/${DB_NAME}_backup.sql"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to dump production database. Check your SSH access.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Production dump created on server.${NC}"

# --- STEP 2: Download dump to local machine ---
echo ""
echo -e "${YELLOW}[2/5] Downloading backup to local machine...${NC}"
scp ${SERVER_USER}@${SERVER_IP}:/root/${DB_NAME}_backup.sql ${BACKUP_FILE}
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to download backup. Check your SSH access.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Backup downloaded to ${BACKUP_FILE}${NC}"

# --- STEP 3: Stop and remove local containers + volumes ---
echo ""
echo -e "${YELLOW}[3/5] Resetting local Docker containers and volumes...${NC}"
docker compose -f ${COMPOSE_FILE} down -v
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to stop local containers.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Local containers stopped and volumes cleared.${NC}"

# --- STEP 4: Start fresh local containers ---
echo ""
echo -e "${YELLOW}[4/5] Starting fresh local containers...${NC}"
docker compose -f ${COMPOSE_FILE} up -d
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to start local containers.${NC}"
  exit 1
fi

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 8
echo -e "${GREEN}✅ Local containers started.${NC}"

# --- STEP 5: Restore backup into local DB ---
echo ""
echo -e "${YELLOW}[5/5] Restoring production data into local database...${NC}"
cat ${BACKUP_FILE} | docker exec -i ${LOCAL_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to restore backup.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Data restored successfully.${NC}"

# --- DONE ---
echo ""
echo "============================================"
echo -e "${GREEN}🎉 All done! Local DB is synced with production.${NC}"
echo ""
echo "  DBeaver Local Connection:"
echo "  Host:     localhost"
echo "  Port:     5436"
echo "  Database: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo "============================================"
echo ""
