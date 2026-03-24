# Keep-Alive Application Startup Script
# This script starts both backend and frontend and keeps them running

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }

Clear-Host
Write-Info "=== Exam Portal - Persistent Startup ==="
Write-Info "This window will keep the application running."
Write-Info "Press Ctrl+C to stop all services."
Write-Info ""

# Step 1: Check Docker
Write-Info "Checking Docker..."
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "✓ Docker is running"
}
catch {
    Write-Error "✗ Docker is not running!"
    Write-Warning "Please start Docker Desktop and try again."
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Start Backend Containers
Write-Info "Starting backend containers..."
Push-Location "$PSScriptRoot\backend"
try {
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker compose up -d 2>&1 | Out-Null
    $ErrorActionPreference = $oldPreference
    Write-Success "✓ Backend containers started"
}
catch {
    Write-Error "✗ Failed to start backend containers"
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# Step 3: Wait for Backend Health
Write-Info "Waiting for backend to be ready..."
$maxAttempts = 60
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    }
    catch {
        # Ignore
    }
    
    if (-not $backendReady) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}
Write-Host ""

if ($backendReady) {
    Write-Success "✓ Backend is ready!"
}
else {
    Write-Warning "⚠ Backend timeout - check logs"
}

# Step 4: Start Frontend (in this same window)
Write-Info "Starting frontend..."
Push-Location "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Warning "Installing dependencies..."
    npm install
}

Write-Success "✓ Launching frontend dev server..."
Write-Info ""
Write-Info "=== APPLICATION RUNNING ==="
Write-Info "Frontend: http://localhost:3001"
Write-Info "Backend:  http://localhost:8080"
Write-Info ""
Write-Warning "Keep this window open to keep the application running."
Write-Warning "Press Ctrl+C to stop all services."
Write-Info ""

# Run frontend in this window (keeps it alive)
npm run dev

# Cleanup on exit
Pop-Location
Write-Info "Shutting down..."
