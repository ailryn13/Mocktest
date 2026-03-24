# 502 Bad Gateway Error - Quick Diagnostic Script
# Run this to quickly check the status of all services

$ErrorActionPreference = "Continue"

function Write-Status { 
    param($service, $status, $color)
    $symbol = if ($status -eq "✓") { "✓" } else { "✗" }
    Write-Host "  $symbol $service" -ForegroundColor $color
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Service Status Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Java processes
Write-Host "Java Processes:" -ForegroundColor Yellow
$javaProcs = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcs) {
    foreach ($proc in $javaProcs) {
        Write-Host "  → PID: $($proc.Id), Started: $($proc.StartTime)" -ForegroundColor White
    }
} else {
    Write-Host "  ✗ No Java processes running" -ForegroundColor Red
}

# Check Docker
Write-Host ""
Write-Host "Docker:" -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Docker" "✓" "Green"
    } else {
        Write-Status "Docker" "✗" "Red"
    }
} catch {
    Write-Status "Docker" "✗" "Red"
}

# Check Docker containers
Write-Host ""
Write-Host "Docker Containers:" -ForegroundColor Yellow
$containers = docker ps --format "table {{.Names}}\t{{.Status}}" 2>$null
if ($containers) {
    Write-Host $containers
} else {
    Write-Host "  ✗ No containers running" -ForegroundColor Red
}

# Check ports
Write-Host ""
Write-Host "Network Ports:" -ForegroundColor Yellow
$ports = @(8080, 9090, 5432, 6379, 5672, 80, 3000)
foreach ($port in $ports) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Status "Port $port (PID: $($listener.OwningProcess))" "✓" "Green"
    } else {
        Write-Status "Port $port" "✗" "Red"
    }
}

# Test backend endpoint
Write-Host ""
Write-Host "Backend Endpoints:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Status "GET /actuator/health ($($response.StatusCode))" "✓" "Green"
} catch {
    Write-Status "GET /actuator/health" "✗" "Red"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -TimeoutSec 2 -ErrorAction Stop
    Write-Status "POST /api/auth/login ($($response.StatusCode))" "✓" "Green"
} catch {
    if ($_.Exception.Message -match "400|401|405") {
        Write-Status "POST /api/auth/login (reachable, needs body)" "✓" "Yellow"
    } else {
        Write-Status "POST /api/auth/login" "✗" "Red"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  If services are down, run: .\fix-502-error.ps1" -ForegroundColor White
Write-Host ""
