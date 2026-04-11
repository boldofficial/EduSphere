# ============================================
# sync-prod-to-local.ps1
# Syncs production database to local Docker
# Usage: .\sync-prod-to-local.ps1
# ============================================

$SERVER_IP = "72.62.160.70"
$SERVER_USER = "root"
$PROD_CONTAINER = "db-rckswgkwswcck0gokswk0s8s-174706343313"
$DB_NAME = "registra_db"
$DB_USER = "registra_admin"
$BACKUP_FILE = "$env:USERPROFILE\registra_backup.sql"
$LOCAL_CONTAINER = "registra_db"
$COMPOSE_FILE = "..\docker-compose.local.yml"

function Write-Green($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Yellow($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Red($msg) { Write-Host $msg -ForegroundColor Red }

Write-Host ""
Write-Host "============================================"
Write-Host "   registra_db - Sync Production to Local"
Write-Host "============================================"
Write-Host ""

Write-Yellow "[1/5] Dumping production database from server..."
ssh "${SERVER_USER}@${SERVER_IP}" "docker exec ${PROD_CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} > /root/${DB_NAME}_backup.sql"
if ($LASTEXITCODE -ne 0) { Write-Red "Failed to dump production database."; exit 1 }
Write-Green "Production dump created on server."

Write-Host ""
Write-Yellow "[2/5] Downloading backup to local machine..."
scp "${SERVER_USER}@${SERVER_IP}:/root/${DB_NAME}_backup.sql" $BACKUP_FILE
if ($LASTEXITCODE -ne 0) { Write-Red "Failed to download backup."; exit 1 }
Write-Green "Backup downloaded to $BACKUP_FILE"

Write-Host ""
Write-Yellow "[3/5] Resetting local Docker containers and volumes..."
docker compose -f $COMPOSE_FILE down -v
if ($LASTEXITCODE -ne 0) { Write-Red "Failed to stop local containers."; exit 1 }
Write-Green "Local containers stopped and volumes cleared."

Write-Host ""
Write-Yellow "[4/5] Starting fresh local containers..."
docker compose -f $COMPOSE_FILE up -d
if ($LASTEXITCODE -ne 0) { Write-Red "Failed to start local containers."; exit 1 }
Write-Host "Waiting for PostgreSQL to be ready..."
Start-Sleep -Seconds 20
Write-Green "Local containers started."

Write-Host ""
Write-Yellow "[5/5] Restoring production data into local database..."
Get-Content $BACKUP_FILE | docker exec -i $LOCAL_CONTAINER psql -U $DB_USER -d $DB_NAME | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Red "Failed to restore backup."; exit 1 }
Write-Green "Data restored successfully."

Write-Host ""
Write-Host "============================================"
Write-Green "All done! Local DB is synced with production."
Write-Host ""
Write-Host "  DBeaver Local Connection:"
Write-Host "  Host:     localhost"
Write-Host "  Port:     5432"
Write-Host "  Database: $DB_NAME"
Write-Host "  Username: $DB_USER"
Write-Host "============================================"
Write-Host ""