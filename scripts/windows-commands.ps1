[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        "dev",
        "build",
        "start",
        "lint",
        "lint:fix",
        "check-types",
        "format",
        "format:check",
        "docker:up",
        "docker:down",
        "docker:reset",
        "docker:logs",
        "docker:ps",
        "db:shell",
        "backend",
        "local",
        "db:sync"
    )]
    [string]$Task
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter()][string[]]$Arguments = @()
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
    }
}

Set-Location $RepoRoot

switch ($Task) {
    "dev" { Invoke-External "npm" @("run", "dev") }
    "build" { Invoke-External "npm" @("run", "build") }
    "start" { Invoke-External "npm" @("run", "start") }
    "lint" { Invoke-External "npm" @("run", "lint") }
    "lint:fix" { Invoke-External "npm" @("run", "lint:fix") }
    "check-types" { Invoke-External "npm" @("run", "check-types") }
    "format" { Invoke-External "npm" @("run", "format") }
    "format:check" { Invoke-External "npm" @("run", "format:check") }

    "docker:up" { Invoke-External "docker" @("compose", "-f", "docker-compose.local.yml", "up", "-d") }
    "docker:down" { Invoke-External "docker" @("compose", "-f", "docker-compose.local.yml", "down") }
    "docker:reset" { Invoke-External "docker" @("compose", "-f", "docker-compose.local.yml", "down", "-v") }
    "docker:logs" { Invoke-External "docker" @("compose", "-f", "docker-compose.local.yml", "logs", "-f") }
    "docker:ps" { Invoke-External "docker" @("compose", "-f", "docker-compose.local.yml", "ps") }

    "db:shell" {
        # Interactive psql shell in local Postgres container.
        & docker exec -it registra_db psql -U registra_admin -d registra_db
    }

    "backend" {
        Set-Location (Join-Path $RepoRoot "backend")
        & .\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8001
    }

    "local" {
        Invoke-External "docker" @("compose", "-f", "docker-compose.local.yml", "up", "-d")
        Invoke-External "npm" @("run", "dev")
    }

    "db:sync" {
        $SERVER_IP = "72.62.160.70"
        $SERVER_USER = "root"
        $PROD_CONTAINER = "db-rckswgkwswcck0gokswk0s8s-102936283131"
        $DB_NAME = "registra_db"
        $DB_USER = "registra_admin"
        $BACKUP_FILE = Join-Path $HOME "registra_backup.sql"
        $LOCAL_CONTAINER = "registra_db"
        $COMPOSE_FILE = "docker-compose.local.yml"

        Write-Host ""
        Write-Host "============================================"
        Write-Host "   registra_db - Sync Production to Local"
        Write-Host "============================================"
        Write-Host ""

        Write-Host "[1/5] Dumping production database from server..."
        Invoke-External "ssh" @(
            "$SERVER_USER@$SERVER_IP",
            "docker exec $PROD_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > /root/${DB_NAME}_backup.sql"
        )

        Write-Host "[2/5] Downloading backup to local machine..."
        Invoke-External "scp" @("$SERVER_USER@$SERVER_IP`:/root/${DB_NAME}_backup.sql", $BACKUP_FILE)

        Write-Host "[3/5] Resetting local Docker containers and volumes..."
        Invoke-External "docker" @("compose", "-f", $COMPOSE_FILE, "down", "-v")

        Write-Host "[4/5] Starting fresh local containers..."
        Invoke-External "docker" @("compose", "-f", $COMPOSE_FILE, "up", "-d")
        Start-Sleep -Seconds 8

        Write-Host "[5/5] Restoring production data into local database..."
        Invoke-External "docker" @("cp", $BACKUP_FILE, "$LOCAL_CONTAINER`:/tmp/${DB_NAME}_backup.sql")
        Invoke-External "docker" @(
            "exec", "-i", $LOCAL_CONTAINER,
            "psql", "-U", $DB_USER, "-d", $DB_NAME, "-f", "/tmp/${DB_NAME}_backup.sql"
        )

        Write-Host ""
        Write-Host "All done. Local DB is synced with production."
        Write-Host "Host: localhost"
        Write-Host "Port: 5432"
        Write-Host "Database: $DB_NAME"
        Write-Host "Username: $DB_USER"
    }
}
