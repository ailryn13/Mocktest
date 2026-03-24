# Fix 502 Bad Gateway Error - Comprehensive Solution
# This script resolves all identified issues

$ErrorActionPreference = "Stop"

function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "→ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing 502 Bad Gateway Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill hung Java processes
Write-Info "Step 1: Cleaning up hung Java processes..."
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    foreach ($proc in $javaProcesses) {
        Write-Warning "Killing Java process (PID: $($proc.Id))..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Success "Java processes terminated"
} else {
    Write-Success "No hung Java processes found"
}

# Step 2: Check Docker
Write-Info "Step 2: Checking Docker status..."
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running!"
    Write-Warning "Please start Docker Desktop and run this script again."
    exit 1
}

# Step 3: Stop any existing containers
Write-Info "Step 3: Stopping existing containers..."
Set-Location "$PSScriptRoot\backend"
docker compose down 2>&1 | Out-Null
Write-Success "Existing containers stopped"

# Step 4: Start backend services
Write-Info "Step 4: Starting backend services (PostgreSQL, Redis, RabbitMQ, Judge0)..."
docker compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend services started"
} else {
    Write-Error "Failed to start backend services"
    exit 1
}

# Step 5: Wait for services to be healthy
Write-Info "Step 5: Waiting for services to be ready..."
Start-Sleep -Seconds 10

$healthy = $false
for ($i = 1; $i -le 30; $i++) {
    $status = docker compose ps --format json 2>$null | ConvertFrom-Json
    $allHealthy = $true
    
    if ($status) {
        foreach ($service in $status) {
            if ($service.Health -and $service.Health -ne "healthy") {
                $allHealthy = $false
                break
            }
        }
    }
    
    if ($allHealthy) {
        $healthy = $true
        break
    }
    
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}

Write-Host ""
if ($healthy) {
    Write-Success "All services are healthy"
} else {
    Write-Warning "Some services may not be fully ready yet"
}

# Step 6: Start Spring Boot backend with reduced memory
Write-Info "Step 6: Starting Spring Boot backend..."
Write-Warning "Using reduced memory settings to prevent OOM errors"

$env:JAVA_OPTS = "-Xms256m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Build the project first
Write-Info "Building backend (this may take a minute)..."
Set-Location "$PSScriptRoot\backend"

# Check if Maven Wrapper exists
if (Test-Path ".\mvnw.cmd") {
    .\mvnw.cmd clean package -DskipTests 2>&1 | Out-Null
} elseif (Test-Path ".\mvnw") {
    .\mvnw clean package -DskipTests 2>&1 | Out-Null
} else {
    Write-Warning "Maven wrapper not found, trying system Maven..."
    mvn clean package -DskipTests 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend built successfully"
    
    # Start the application
    Write-Info "Starting application..."
    $jarFile = Get-ChildItem -Path "target" -Filter "*.jar" | Select-Object -First 1
    
    if ($jarFile) {
        Write-Success "Starting $($jarFile.Name)..."
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Backend Services Running!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services:" -ForegroundColor Cyan
        Write-Host "  • Backend API:    http://localhost:8080" -ForegroundColor White
        Write-Host "  • PostgreSQL:     localhost:5432" -ForegroundColor White
        Write-Host "  • Redis:          localhost:6379" -ForegroundColor White
        Write-Host "  • RabbitMQ:       localhost:5672" -ForegroundColor White
        Write-Host "  • Judge0:         http://localhost:2358" -ForegroundColor White
        Write-Host ""
        Write-Host "Starting backend... (check for startup confirmation)" -ForegroundColor Yellow
        Write-Host ""
        
        # Start in a new window to avoid blocking
        Start-Process -FilePath "java" -ArgumentList @(
            "-Xms256m",
            "-Xmx1024m",
            "-XX:+UseG1GC",
            "-XX:MaxGCPauseMillis=200",
            "-jar",
            "target\$($jarFile.Name)"
        ) -WorkingDirectory "$PSScriptRoot\backend"
        
        Write-Success "Backend is starting in a new process"
        Write-Info "Waiting 15 seconds for backend to start..."
        Start-Sleep -Seconds 15
        
        # Test the endpoint
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 5 -ErrorAction Stop
            Write-Success "Backend is running! Status: $($response.StatusCode)"
            Write-Host ""
            Write-Host "You can now test the login endpoint:" -ForegroundColor Green
            Write-Host "  POST http://localhost:8080/api/auth/login" -ForegroundColor White
            Write-Host ""
        } catch {
            Write-Warning "Backend may still be starting up. Check manually at:"
            Write-Host "  http://localhost:8080/actuator/health" -ForegroundColor White
        }
        
    } else {
        Write-Error "JAR file not found in target directory"
        exit 1
    }
    
} else {
    Write-Error "Build failed"
    exit 1
}

Write-Host ""
Write-Host "To check backend logs, look in the new console window" -ForegroundColor Gray
Write-Host "To stop services: cd backend; docker compose down" -ForegroundColor Gray
Write-Host ""
