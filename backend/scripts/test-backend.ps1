# test-backend.ps1
# Helper script to run Django tests for the Registra backend.

$ErrorActionPreference = "Stop"

Write-Host "--- Operation 5: Test Offensive ---" -ForegroundColor Cyan
Write-Host "Running Backend Tests..." -ForegroundColor Yellow

# Ensure we are in the backend directory
Set-Location "$PSScriptRoot\.."

python manage.py test --keepdb

if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests Failed!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Tests Passed!" -ForegroundColor Green
}
