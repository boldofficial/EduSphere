#!/bin/bash

# ============================================
# deploy-updates.sh
# One-stop-shop for deploying codebase updates
# Usage: bash scripts/deploy-updates.sh
# ============================================

# --- CONFIG ---
PYTHON_ENV=".venv/bin/python3"
BACKEND_DIR="backend"
CONTAINER_NAME="${BACKEND_CONTAINER:-registra_backend}"

# --- COLORS ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "============================================"
echo "   EduSphere — Deployment & Update Utility"
echo "============================================"
echo ""

# Function to run manage.py commands
run_manage_cmd() {
    local cmd=$1
    if [ -f /.dockerenv ]; then
        python3 manage.py $cmd
    elif docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker exec ${CONTAINER_NAME} python3 manage.py $cmd
    else
        cd ${BACKEND_DIR} && ../${PYTHON_ENV} manage.py $cmd && cd ..
    fi
}

# 1. Schema Migrations (always first)
echo -e "${YELLOW}[1/3] Running Database Migrations...${NC}"
run_manage_cmd "migrate"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Migrations failed.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Database migrations complete.${NC}"

# 2. Maintenance & Data Fixes
echo ""
echo -e "${YELLOW}[2/3] Running Data Maintenance Commands...${NC}"
run_manage_cmd "cleanup_threads"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Maintenance commands failed.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Data maintenance complete.${NC}"

# 3. Static Files
echo ""
echo -e "${YELLOW}[3/3] Collecting Static Files...${NC}"
run_manage_cmd "collectstatic --noinput"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Static files collection failed.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Static files collected.${NC}"

# --- DONE ---
echo ""
echo "============================================"
echo -e "${GREEN}🎉 All updates applied successfully!${NC}"
echo "============================================"
echo ""
