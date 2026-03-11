# 502 Bad Gateway Error - Root Cause Analysis & Fix

## Problem Summary
**Error**: `api/auth/login` returns 502 (Bad Gateway)
**Date**: March 11, 2026
**Impact**: Login functionality completely broken, application unusable

---

## Root Causes Identified

### 1. **Backend Not Listening on Port 8080** ⚠️ CRITICAL
- **Finding**: Java process (PID 27148) running but NOT listening on any port
- **Evidence**: 
  - `Get-NetTCPConnection` shows no listeners on ports 8080, 9090
  - Process started at 18:08:09 but no network activity
- **Cause**: Backend crashed/hung after startup due to memory issues

### 2. **Java Memory Exhaustion** ⚠️ CRITICAL
- **Finding**: Multiple Java crash dumps found (`hs_err_pid*.log`)
- **Evidence**:
  ```
  # There is insufficient memory for the Java Runtime Environment to continue.
  # Native memory allocation (malloc) failed to allocate 1048576 bytes.
  ```
- **Cause**: 
  - Java process running out of native memory
  - System under memory pressure (16GB machine, multiple Java processes)
  - Default JVM settings too aggressive for available RAM

### 3. **Docker Containers Not Running** ⚠️ HIGH
- **Finding**: `docker ps -a` returns empty
- **Evidence**: No containers running for:
  - PostgreSQL (required for database)
  - Redis (required for caching/atomic counters)
  - RabbitMQ (required for WebSocket broker)
  - Nginx (if using containerized frontend)
- **Cause**: Services not started or crashed previously

### 4. **Service Dependencies Not Met**
- **Finding**: Backend requires PostgreSQL, Redis, RabbitMQ to function
- **Evidence**: `application.yml` shows required connections:
  - `jdbc:postgresql://localhost:5432/exam_portal_db`
  - Redis: `localhost:6379`
  - RabbitMQ: `localhost:5672`
- **Impact**: Backend cannot start properly without these services

### 5. **API Path Configuration**
- **Configuration**: 
  - Frontend calls: `/api/auth/login`
  - Nginx proxies: `/api/` → `http://backend:8080/api/`
  - Backend controller: `@RequestMapping("/api/auth")`
- **Status**: ✅ Configuration is CORRECT
- **Note**: 502 error is NOT due to URL mismatch, but backend unavailability

---

## Architecture Flow

```
Browser/Frontend
    ↓ POST /api/auth/login
Nginx (port 80)
    ↓ proxy_pass to backend:8080/api/
Spring Boot Backend (port 8080)
    ↓ requires
PostgreSQL (port 5432)
Redis (port 6379)
RabbitMQ (port 5672)
```

**Problem**: Backend (port 8080) is DOWN → Nginx gets connection refused → Returns 502

---

## Solutions Implemented

### Immediate Fixes
1. **Kill Hung Java Process**
   ```powershell
   Stop-Process -Id 27148 -Force
   ```

2. **Start Docker Services**
   ```powershell
   cd backend
   docker compose up -d
   ```

3. **Reduce Java Memory Settings**
   ```
   JAVA_OPTS: -Xms256m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200
   ```
   - **Before**: Default settings (often 2GB+ heap)
   - **After**: Max 1GB heap, G1GC for better memory management

4. **Restart Backend Application**
   ```powershell
   java -Xms256m -Xmx1024m -XX:+UseG1GC -jar target/exam-portal.jar
   ```

### Automated Fix Script
Created `fix-502-error.ps1` that:
1. Kills all Java processes
2. Checks Docker status
3. Starts backend Docker services (PostgreSQL, Redis, RabbitMQ, Judge0)
4. Waits for services to be healthy
5. Builds backend (if needed)
6. Starts Spring Boot with optimized memory settings
7. Validates backend is responding

---

## Verification Steps

### 1. Check All Services Running
```powershell
.\diagnose-502.ps1
```

Expected output:
```
✓ Docker
✓ Port 8080 (Backend)
✓ Port 5432 (PostgreSQL)
✓ Port 6379 (Redis)
✓ Port 5672 (RabbitMQ)
✓ GET /actuator/health (200)
✓ POST /api/auth/login (reachable)
```

### 2. Test Login Endpoint
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@examportal.com","password":"student123"}'
```

Expected: 200 OK with JWT token

### 3. Check Backend Logs
```powershell
docker compose logs -f
# OR
# Check console window where Java is running
```

Look for:
```
Tomcat started on port 8080 (http)
Started ExamPortalApplication in X seconds
```

---

## Prevention Measures

### 1. Always Use Docker Compose for Services
```powershell
# Start services
cd backend
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 2. Configure Proper JVM Memory Limits
Add to `backend/start-backend.ps1`:
```powershell
$env:JAVA_OPTS = "-Xms256m -Xmx1024m -XX:+UseG1GC"
```

Or in `application.yml`:
```yaml
spring:
  application:
    jvm-options: -Xms256m -Xmx1024m -XX:+UseG1GC
```

### 3. Monitor System Resources
- Close unnecessary applications before starting backend
- Use Task Manager to check available RAM
- Consider upgrading to 32GB RAM if running many services

### 4. Health Checks
Add to startup routine:
```powershell
# Wait for backend
Start-Sleep -Seconds 10
$health = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health"
if ($health.StatusCode -ne 200) {
    Write-Error "Backend failed to start!"
}
```

---

## Quick Reference

### Start Everything
```powershell
.\fix-502-error.ps1
```

### Check Status
```powershell
.\diagnose-502.ps1
```

### Stop Everything
```powershell
cd backend
docker compose down
Stop-Process -Name "java" -Force
```

### View Backend Logs
```powershell
cd backend
docker compose logs -f
```

---

## Files Modified/Created

1. **Created**: `fix-502-error.ps1` - Automated fix script
2. **Created**: `diagnose-502.ps1` - Quick diagnostic tool
3. **Created**: `502-ERROR-ANALYSIS.md` - This document

---

## Additional Notes

### Default Test Users
- **Student**: `student@examportal.com` / `student123`
- **Moderator**: `moderator@examportal.com` / `moderator123`

### Service Ports
- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:80` (if using Docker)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672`
- RabbitMQ UI: `http://localhost:15672` (if enabled)
- Judge0: `http://localhost:2358`

### Troubleshooting
If issues persist:
1. Check Docker Desktop is running
2. Restart Docker Desktop
3. Clear Docker volumes: `docker compose down -v`
4. Rebuild: `docker compose up -d --build`
5. Check Windows Firewall isn't blocking ports
6. Ensure no other services using ports 8080, 5432, 6379, 5672

---

## Contact
For additional support, check:
- `README.md` - Project documentation
- `backend/docker-compose.yml` - Service configuration
- `backend/src/main/resources/application.yml` - App configuration
