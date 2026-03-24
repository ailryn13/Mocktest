# Mocktest Java Question Execution Error - Diagnosis & Fix Plan

## Executive Summary
❌ **Status**: Application FAILED TO START  
🔍 **Root Cause**: Missing PostgreSQL database  
⚠️ **Impact**: All API endpoints (including login) return 502  
📅 **Date Diagnosed**: March 18, 2026

---

## Part 1: Root Cause Analysis

### Error Details
```
org.postgresql.util.PSQLException: FATAL: database "mocktest" does not exist
```

**Source**: Backend startup logs from `2026-03-16T21:14:52.314Z`

### Why It Happened

1. **Database Not Created**
   - The PostgreSQL service was started
   - But the required database was never initialized
   - Hibernate tried to connect and failed immediately

2. **Service Chain Broken**
   ```
   Browser → Nginx (80)
      ↓
   Nginx tries to proxy → Spring Boot (8080)
      ↓
   Spring Boot fails to start (no database)
      ↓
   502 Bad Gateway returned to client
   ```

3. **Contributing Factors**
   - Missing database initialization script execution
   - No DDL auto-creation (or it's set to 'update' which still needs a database to exist)
   - Docker containers not properly sequenced with health checks

---

## Part 2: Configuration Confusion

### Different Database Names Found
| File | Database Name | Status |
|------|---------------|--------|
| `application.yml` | `exam_portal_db` | ✅ Default: EXISTS |
| `docker-compose.examportal.yml` | `exam_portal_db` | ✅ Configured |
| `docker-compose.gcp.yml` | `mocktest_db` | ❌ Wrong |
| Error message | `mocktest` | ❌ Wrong |

**Conclusion**: The AWS deployment is using the wrong database name or configuration.

---

## Part 3: Solution Plan

### Immediate Fix (SSH Required - Currently Blocked)

**Step 1: Connect to AWS Server**
```bash
ssh -i C:\Users\ganes\OneDrive\Desktop\mocktest.pem ubuntu@3.222.6.232
```
⚠️ **Issue**: Connection timing out (port 22 blocked in security group)

**Step 2: Create Database**
```bash
sudo -u postgres psql -c "CREATE DATABASE exam_portal_db OWNER exam_admin;"
```

**Step 3: Initialize Schema**
```bash
# If using Flyway migrations (auto-runs on startup)
# Just restart the application:
docker-compose restart backend

# Or manually run SQL initialization:
sudo -u postgres psql exam_portal_db < /path/to/schema.sql
```

**Step 4: Start All Services**
```bash
docker-compose down
docker-compose up -d
```

### Alternative Fix (Local Testing)

If you want to test locally before deploying:

```powershell
# 1. Ensure Docker Desktop is running
# 2. Start the compose stack
cd "C:\Users\ganes\OneDrive\Desktop\Mocktest-main"
docker-compose up -d

# 3. Wait for PostgreSQL to be ready
Start-Sleep -Seconds 10

# 4. Create the database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE exam_portal_db OWNER exam_admin;"

# 5. Run the backend
docker-compose up backend
```

---

## Part 4: AWS Security Group Issue

### Problem
SSH connection times out to `3.222.6.232:22`

### Cause
Security group doesn't allow inbound traffic on port 22 (SSH)

### Fix Steps
1. Go to AWS Console → EC2 → Security Groups
2. Find the security group attached to instance `3.222.6.232`
3. Add inbound rule:
   - **Type**: SSH
   - **Protocol**: TCP
   - **Port**: 22
   - **Source**: Your IP (or `0.0.0.0/0` for testing only - **NOT SECURE**)
4. Save and retry SSH connection

---

## Part 5: Java Question Execution

After fixing the above, your Java question should work:

### Expected Flow
1. ✅ User submits: "Write program to print 'Hello World'"
2. ✅ Backend receives request on `POST /api/questions/test`
3. ✅ Backend calls Judge0 (code execution sandbox)
4. ✅ Judge0 compiles code
5. ✅ Judges output
6. ✅ Compare with expected: `"Hello World"`
7. ✅ Return result

### Required Code
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
```
⚠️ **NO exclamation mark** - Your test expects exactly `Hello World`

---

## Part 6: Verification Checklist

### Pre-Fix Verification
- [ ] Check if Docker is running: `docker ps`
- [ ] Check PostgreSQL container: `docker logs postgres`
- [ ] Check backend logs: `docker compose logs backend`

### Post-Fix Verification
Command to verify everything is working:

```bash
# 1. Check database exists
psql -h localhost -U exam_admin -d exam_portal_db -c "\dt"

# 2. Test backend is listening
curl http://localhost:8080/api/health

# 3. Test login (should work or give proper error, not 502)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# 4. Test code execution
curl -X POST http://localhost:8080/api/questions/exec \
  -H "Content-Type: application/json" \
  -d '{"code":"public class Main{public static void main(String[] a){System.out.println(\"Hello World\");}}","language":"java"}'
```

---

## Part 7: Database Configuration Reference

### Default Configuration (from application.yml)
```yaml
Database: exam_portal_db
Username: exam_admin
Password: SecurePassword123!
Host: localhost
Port: 5432
```

### Docker Compose Override
```yaml
POSTGRES_DB: exam_portal_db
POSTGRES_USER: exam_admin
POSTGRES_PASSWORD: SecurePassword123!
```

### Environment Variables (if using)
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/exam_portal_db
SPRING_DATASOURCE_USERNAME=exam_admin
SPRING_DATASOURCE_PASSWORD=SecurePassword123!
```

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Error on all endpoints | Database doesn't exist | Create `exam_portal_db` |
| Backend won't start | Database connection fails | Initialize PostgreSQL |
| Can't SSH to server | Security group blocks port 22 | Add SSH inbound rule |
| Java code won't execute | Backend unavailable | Fix above two issues |

**Next Step**: Fix the AWS security group to allow SSH, then create the database.
