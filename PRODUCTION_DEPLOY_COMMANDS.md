# Production Deployment Instructions

## Server Details
- **IP**: 3.222.6.232
- **Domain**: mock-test.duckdns.org
- **User**: ubuntu

## Deployment Steps

### 1. SSH to Production Server
```bash
ssh ubuntu@3.222.6.232
```

### 2. Navigate to Application Directory
```bash
cd ~/Mocktest
# Or wherever your docker-compose.hub.yml is located
```

### 3. Pull Latest Images from Docker Hub
```bash
docker pull ganesh200504/exam-portal-backend:latest
docker pull ganesh200504/exam-portal-frontend:latest
```

### 4. Restart Containers with New Images
```bash
docker compose -f docker-compose.hub.yml up -d --force-recreate backend frontend
```

**Alternative**: If you want to restart all services:
```bash
docker compose -f docker-compose.hub.yml down
docker compose -f docker-compose.hub.yml up -d
```

### 5. Verify Deployment
```bash
# Check container status
docker ps

# Check backend logs
docker logs exam-portal-backend --tail 50

# Check frontend logs
docker logs exam-portal-frontend --tail 50
```

### 6. Test Login from Your Local Machine
```powershell
Invoke-WebRequest -Uri "https://mock-test.duckdns.org/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"superadmin@mocktest.app","password":"SuperAdmin@123456"}' | 
  Select-Object StatusCode, Content
```

**Expected Result**: 200 OK with JWT token

## Optional: Database Fix (if login still fails)

If login still returns 401 after container restart, connect to PostgreSQL and run:

```bash
# Access PostgreSQL container
docker exec -it <postgres-container-name> psql -U postgres -d exam_portal_db

# Run these SQL commands
UPDATE users 
SET password = password_hash 
WHERE email='superadmin@mocktest.app' 
  AND (password IS NULL OR password='');

INSERT INTO user_role (user_id, role_id) 
SELECT u.id, r.id 
FROM users u 
JOIN roles r ON r.name='SUPER_ADMIN' 
WHERE u.email='superadmin@mocktest.app' 
  AND NOT EXISTS (
    SELECT 1 FROM user_role ur 
    WHERE ur.user_id=u.id AND ur.role_id=r.id
  );
```

## What Was Fixed

The new Docker images contain authentication fixes:
- **User.java**: Added `passwordHash` field with bidirectional sync between `password` and `password_hash` columns
- **CustomUserDetails.java**: Modified `getPassword()` to fallback to `passwordHash` for legacy database rows

These changes ensure compatibility with the production database schema where `password_hash` column is populated but `password` may be NULL.

## Deployed Images

- **Backend**: `ganesh200504/exam-portal-backend:latest` (sha256:7ca6e456dfbb...)
- **Frontend**: `ganesh200504/exam-portal-frontend:latest` (sha256:75c028e79...)
