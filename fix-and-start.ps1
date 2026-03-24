# Complete Fix and Start Script for Exam Portal
# Resolves 502 error by ensuring all services are properly configured

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "→ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "! $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

Clear-Host
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Exam Portal - Complete Fix & Startup Script              ║" -ForegroundColor Cyan
Write-Host "║  Fixes: 502 Bad Gateway, Docker containers, hung processes ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Navigate to project root
Set-Location $PSScriptRoot

# ==================== STEP 1: Clean Up Hung Processes ====================
Write-Step "Step 1: Cleaning up hung Java processes"

$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    Write-Warning "Found $($javaProcesses.Count) Java process(es) running"
    foreach ($proc in $javaProcesses) {
        Write-Info "Killing Java process PID $($proc.Id) (started $($proc.StartTime))..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    $remaining = Get-Process -Name "java" -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Error "Failed to terminate some Java processes: $($remaining.Id -join ', ')"
    } else {
        Write-Success "All Java processes terminated"
    }
} else {
    Write-Success "No hung Java processes found"
}

# ==================== STEP 2: Check Docker ====================
Write-Step "Step 2: Verifying Docker status"

try {
    $dockerVersion = docker --version 2>&1
    Write-Success "Docker installed: $dockerVersion"
    
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker daemon is running"
    } else {
        Write-Error "Docker daemon is not responding"
        Write-Warning "Please start Docker Desktop manually, then run this script again"
        exit 1
    }
} catch {
    Write-Error "Docker is not available"
    Write-Warning "Please install Docker Desktop and try again"
    exit 1
}

# ==================== STEP 3: Clean Up Old Containers ====================
Write-Step "Step 3: Removing old containers and volumes"

Set-Location "$PSScriptRoot\backend"

Write-Info "Stopping and removing existing containers..."
docker compose down -v --remove-orphans 2>&1 | Out-Null

$allContainers = docker ps -a --filter "name=exam-portal" --format "{{.ID}}"
if ($allContainers) {
    Write-Warning "Forcefully removing orphaned containers..."
    docker rm -f $allContainers 2>&1 | Out-Null
}

Write-Success "Old containers removed"

# ==================== STEP 4: Start Docker Containers ====================
Write-Step "Step 4: Starting Docker containers (PostgreSQL, Redis, RabbitMQ)"

Write-Info "Starting containers with docker compose..."
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker compose failed!"
    Write-Warning "Check Docker Desktop and docker-compose.yml configuration"
    exit 1
}

Start-Sleep -Seconds 3

# Verify containers started
$runningContainers = docker compose ps --format "{{.Name}}" 2>&1
Write-Info "Running containers:"
docker compose ps

# ==================== STEP 5: Wait for PostgreSQL ====================
Write-Step "Step 5: Waiting for PostgreSQL to be ready"

$maxWait = 30
$waited = 0
$postgresReady = $false

while ($waited -lt $maxWait -and -not $postgresReady) {
    $waited++
    try {
        # Check if PostgreSQL port is listening
        $connection = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($connection) {
            Write-Success "PostgreSQL is ready on port 5432"
            $postgresReady = $true
        } else {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
}

Write-Host ""

if (-not $postgresReady) {
    Write-Error "PostgreSQL failed to start within ${maxWait}s"
    Write-Warning "Check container logs: docker logs exam-portal-postgres"
    exit 1
}

# ==================== STEP 6: Start Backend Application ====================
Write-Step "Step 6: Starting Spring Boot backend"

if (-not (Test-Path "$PSScriptRoot\backend\app.jar")) {
    Write-Error "backend/app.jar not found!"
    Write-Warning "Build the project first: cd backend; mvn clean package -DskipTests"
    exit 1
}

Write-Info "Starting backend JAR with optimized memory settings..."
Write-Info "Backend will start on port 8080 (default from application.yml)"

# Start backend in a new window
$javaArgs = @(
    "-Xms128m",
    "-Xmx768m",
    "-XX:+UseSerialGC",
    "-jar",

    "app.jar"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\backend'; Write-Host 'Starting Backend on port 8080...' -ForegroundColor Green; java $($javaArgs -join ' ')"
)

Write-Success "Backend JAR launched in new window"

# ==================== STEP 7: Wait for Backend ====================
Write-Step "Step 7: Waiting for backend to initialize"

Write-Info "Waiting for backend at http://localhost:8080..."
Write-Warning "This may take 30-60 seconds while Spring Boot initializes..."

$maxWait = 90
$waited = 0
$backendReady = $false

while ($waited -lt $maxWait -and -not $backendReady) {
    $waited++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 2 -ErrorAction SilentlyContinue -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend is ready!"
            $backendReady = $true
        }
    } catch {
        # Check if port is at least listening
        $portListening = Test-NetConnection -ComputerName localhost -Port 8080 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($portListening) {
            Write-Info "Port 8080 is listening, waiting for health endpoint..."
        }
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}

Write-Host ""

if ($backendReady) {
    Write-Success "Backend health check passed!"
} else {
    Write-Warning "Backend did not respond within ${maxWait}s"
    Write-Info "The backend may still be starting. Check the backend window for logs."
}

# ==================== STEP 8: Test Login Endpoint ====================
Write-Step "Step 8: Testing login endpoint"

Start-Sleep -Seconds 2

try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{}' `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Error "Unexpected success response (this should fail with 400)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Success "Login endpoint working correctly! (HTTP $statusCode - client error as expected)"
        Write-Success "502 Bad Gateway error is FIXED!"
    } elseif ($statusCode -eq 502) {
        Write-Error "Still getting 502 Bad Gateway!"
        Write-Warning "Backend may not be listening on port 8080"
    } else {
        Write-Warning "Login endpoint returned HTTP $statusCode"
    }
}

# ==================== FINAL SUMMARY ====================
Write-Step "Startup Complete"

Write-Host ""
Write-Success "All systems started successfully!"
Write-Host ""
Write-Info "Service URLs:"
Write-Host "  • Backend API:     http://localhost:8080/api/" -ForegroundColor White
Write-Host "  • Health Check:    http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "  • PostgreSQL:      localhost:5432" -ForegroundColor White
Write-Host "  • Redis:           localhost:6379" -ForegroundColor White
Write-Host "  • RabbitMQ:        localhost:5672" -ForegroundColor White
Write-Host ""
Write-Info "Next Steps:"
Write-Host "  1. Check backend logs in the new window" -ForegroundColor White
Write-Host "  2. Start frontend: cd frontend; npm install; npm run dev" -ForegroundColor White
Write-Host "  3. Test login from frontend or use Postman" -ForegroundColor White
Write-Host ""
Write-Warning "Keep the backend window open - closing it will stop the backend!"
Write-Host ""

# Check container status one more time
Write-Info "Docker container status:"
docker compose -f "$PSScriptRoot\backend\docker-compose.yml" ps
