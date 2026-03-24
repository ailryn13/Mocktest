# Start Mocktest Environment (Hybrid Mode)
# Docker: Database, Redis, RabbitMQ, Judge0
# Local: Backend (9090), Frontend (3001)

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }

Clear-Host
Write-Info "=== Mocktest Startup (Port 9090) ==="

# 1. Cleanup Stale Processes
Write-Info "Cleaning up old processes..."
Get-Process -Name "java", "node", "adb" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Start Docker Dependencies (Backend folder)
Write-Info "Starting Database & Services..."
Push-Location "$PSScriptRoot\backend"
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker failed to start. Please check Docker Desktop."
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# 3. Wait for Database
Write-Info "Waiting for Database..."
Start-Sleep -Seconds 5

# 4. Start Backend (Local Java)
Write-Info "Starting Backend on 9090..."
$backendProcess = Start-Process -FilePath "java" -ArgumentList "-jar", "$PSScriptRoot\backend\app.jar", "--server.port=9090" -PassThru -NoNewWindow
Write-Success "✓ Backend launched"

# 5. Start Frontend
Write-Info "Starting Frontend..."
Push-Location "$PSScriptRoot\frontend"
if (-not (Test-Path "node_modules")) { npm install }
$frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "npm run dev -- --port 3001" -PassThru
Pop-Location
Write-Success "✓ Frontend launched"

Write-Info ""
Write-Info "=== SYSTEM RUNNING ==="
Write-Info "Frontend: http://localhost:3001"
Write-Info "Backend:  http://localhost:9090"
Write-Info "Database: localhost:5432"
Write-Info ""
Write-Warning "DO NOT CLOSE THIS WINDOW"
Write-Info "Press Ctrl+C to stop servers."

# Keep script running
try {
    Read-Host "Press Enter to stop servers..."
}
finally {
    Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
    Write-Info "Servers stopped."
}
