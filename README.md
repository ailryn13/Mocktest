# Exam Portal - Quick Start Guide

## 🚀 Start the Application (One Command!)

```powershell
.\start-app.ps1
```

**That's it!** This single command will:
- ✅ Check if Docker is running
- ✅ Start all backend services (Database, Redis, RabbitMQ, Judge0, Backend API)
- ✅ Wait for backend to be ready
- ✅ Start the frontend
- ✅ Open your browser automatically

---

## 🛑 Stop the Application

```powershell
.\stop-app.ps1
```

---

## 📋 What You Need

Before running the app, make sure:
1. **Docker Desktop is running** (it should auto-start with Windows)
2. That's it! Everything else is handled automatically.

---

## 🔧 Troubleshooting

### "Docker is not running"
- Open Docker Desktop and wait for it to start
- Run `.\start-app.ps1` again

### Port 8080 or 3001 already in use
- Run `.\stop-app.ps1` first
- Then run `.\start-app.ps1` again

### Frontend won't start
- The script will open a new window for the frontend
- If it fails, manually run: `cd frontend; npm run dev`

---

## 📁 Project Structure

```
mock test/
├── start-app.ps1          ← START HERE!
├── stop-app.ps1           ← Stop everything
├── backend/
│   ├── start-backend.ps1  ← Backend only (if needed)
│   └── docker-compose.yml
└── frontend/
    └── package.json
```

---

## 🌐 Access Points

After starting:
- **Application**: http://localhost:3001
- **Backend API**: http://localhost:9090
- **RabbitMQ Admin**: http://localhost:15672 (user: exam_user, pass: exam_password)

---

## 💡 Tips

- **First time setup**: The script will install npm dependencies automatically
- **After reboot**: Just run `.\start-app.ps1` - everything persists in Docker volumes
- **View logs**: `docker logs exam-portal-backend -f`
- **Restart backend only**: `docker restart exam-portal-backend`

---

## ⚡ Quick Commands Reference

| Action | Command |
|--------|---------|
| Start everything | `.\start-app.ps1` |
| Stop everything | `.\stop-app.ps1` |
| View backend logs | `docker logs exam-portal-backend -f` |
| Restart backend | `docker restart exam-portal-backend` |
| Check running services | `docker ps` |

---

**Need help?** Check `backend/STARTUP_GUIDE.md` for detailed information.

---

## ☁️ Cloud Deployment

### Google Cloud Platform (GCP) - Recommended

This application is now deployed on **Google Cloud Platform**. For production deployment:

📘 **See [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)** for complete deployment guide including:
- Cloud SQL (PostgreSQL) setup
- Cloud Memorystore (Redis) configuration
- Cloud Run or Compute Engine deployment
- Cost estimates and scaling guide
- Security best practices

Quick deploy to GCP:
```bash
# Configure GCP project
gcloud config set project YOUR_PROJECT_ID

# Build and push images
./scripts/build-and-push-gcp.ps1

# Deploy
./deploy-gcp.sh
```

### AWS Deployment (Deprecated)

⚠️ **Note:** AWS deployment files are legacy and no longer maintained. The project has migrated to GCP.
