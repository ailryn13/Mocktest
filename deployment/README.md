# 🚀 Deployment Guide for GCP VM (34.180.47.20)

## 📦 What's in this package

- **exam-portal-backend-1.0.0.jar** (113 MB) - Production-ready backend
- **application-production.yml** - Production configuration  
- **start-backend.sh** - Startup script
- **stop-backend.sh** - Shutdown script

---

## ✅ Prerequisites on GCP VM

Ensure these services are running on your VM:

```bash
# Check Docker containers
docker ps

# You should see:
# - exam-portal-postgres (port 5432)
# - exam-portal-redis (port 6379)
# - exam-portal-rabbitmq (port 5672)
```

---

## 📤 Step 1: Upload Files to VM

Using your preferred method (SCP, SFTP, or Web UI):

```bash
# From your local machine (use Git Bash, WSL, or PuTTY/WinSCP)
scp -i mocktest.pem deployment/* ubuntu@34.180.47.20:~/backend/
```

**Or manually:**
1. Open WinSCP or FileZilla
2. Connect to: **34.180.47.20**
3. User: **ubuntu**
4. Key: **mocktest.pem**
5. Upload all files from `deployment\` to `/home/ubuntu/backend/`

---

## 🔧 Step 2: Configure Production Settings

SSH into your VM and update the configuration:

```bash
# SSH into VM (use Git Bash or PuTTY)
ssh -i mocktest.pem ubuntu@34.180.47.20

# Navigate to backend directory
cd ~/backend

# Create a production config file
cp application-production.yml config/application-production.yml

# Edit if needed (database passwords, JWT secret, etc.)
nano config/application-production.yml
```

### Required Environment Variables

Create a `.env` file if you want to override defaults:

```bash
# ~/backend/.env
JWT_SECRET=YourSuperSecretKey256BitsLong12345678901234567890
SPRING_DATASOURCE_PASSWORD=YourSecurePostgresPassword
```

---

## 🚀 Step 3: Start the Backend

```bash
# Make scripts executable
chmod +x start-backend.sh stop-backend.sh

# Start the backend
./start-backend.sh
```

Expected output:
```
=== Starting Exam Portal Backend ===
Starting backend on port 8080...
✓ Backend started successfully!
  PID: 12345
  Log file: logs/application.log

Waiting for application to start...
✓ Health check passed!

Backend is running at:
  - Local: http://localhost:8080
  - External: http://34.180.47.20:8080
```

---

## 🔍 Step 4: Verify Deployment

### Check Health Endpoint

```bash
# From VM
curl http://localhost:8080/actuator/health

# From your local machine
curl http://34.180.47.20:8080/actuator/health
```

Expected response:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"},
    "rabbit": {"status": "UP"}
  }
}
```

### View Logs

```bash
# Real-time logs
tail -f logs/application.log

# Last 100 lines
tail -n 100 logs/application.log

# Search for errors
grep ERROR logs/application.log
```

---

## 🔥 Firewall Configuration

Ensure GCP firewall allows traffic:

```bash
# Check from your local machine
curl -I http://34.180.47.20:8080/actuator/health
```

**If connection refused**, add firewall rule in GCP Console:
1. Go to **VPC Network > Firewall**
2. Create Firewall Rule:
   - Name: `allow-backend-8080`
   - Targets: All instances
   - Source IP ranges: `0.0.0.0/0`
   - Protocols/ports: `tcp:8080`

---

## 🔄 Common Operations

### Stop Backend
```bash
./stop-backend.sh
```

### Restart Backend
```bash
./stop-backend.sh
./start-backend.sh
```

### Update Backend (New Version)
```bash
# Stop current version
./stop-backend.sh

# Backup old JAR
mv exam-portal-backend-1.0.0.jar exam-portal-backend-1.0.0.jar.backup

# Upload new JAR (from your local machine)
# scp -i mocktest.pem new-jar ubuntu@34.180.47.20:~/backend/

# Start new version
./start-backend.sh
```

### Check Status
```bash
# Check if running
ps aux | grep exam-portal

# Check port
netstat -tuln | grep 8080

# Check resources
top -p $(cat backend.pid)
```

---

## 🌐 Frontend Configuration

Update your frontend to point to the new backend:

```bash
# In your frontend .env or configuration
REACT_APP_API_URL=http://34.180.47.20:8080/api
VITE_API_URL=http://34.180.47.20:8080/api
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check logs
cat logs/application.log

# Check if port is already in use
netstat -tuln | grep 8080
lsof -i :8080

# Check database connectivity
docker exec -it exam-portal-postgres psql -U exam_admin -d exam_portal_db -c '\l'
```

### Out of Memory

```bash
# Edit start-backend.sh and increase heap size
-Xms1024m \
-Xmx4096m \
```

### Database Connection Refused

```bash  
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL  logs
docker logs exam-portal-postgres

# Restart PostgreSQL
docker restart exam-portal-postgres
```

---

## 📊 Monitoring

### Application Logs
```bash
tail -f logs/application.log
```

### System Resources
```bash
# CPU and Memory
htop

# Disk space
df -h

# Docker stats
docker stats
```

### Health Checks
```bash
# Automated health check every 30 seconds
watch -n 30 'curl -s http://localhost:8080/actuator/health | jq'
```

---

## 🔒 Security Recommendations

1. **Change default passwords** in `application-production.yml`
2. **Set strong JWT secret** (256-bit minimum)
3. **Configure firewall** to restrict access
4. **Enable HTTPS** using Let's Encrypt or GCP Load Balancer
5. **Regular backups** of PostgreSQL database

---

## 📞 Support

For issues:
1. Check logs: `tail -f logs/application.log`
2. Verify all Docker services are running: `docker ps`
3. Test database connection
4. Check firewall rules

---

## ✅ Quick Deployment Checklist

- [ ] Docker services (PostgreSQL, Redis, RabbitMQ) are running
- [ ] Files uploaded to VM
- [ ] Scripts are executable (`chmod +x`)
- [ ] Configuration updated (passwords, JWT secret)
- [ ] Firewall rules configured (port 8080)
- [ ] Backend started successfully
- [ ] Health check passes
- [ ] Frontend configured to use new backend URL

**Your backend will be available at: http://34.180.47.20:8080**
