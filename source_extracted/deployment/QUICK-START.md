# 🎯 Quick Reference - Deployment Commands

## 📤 Upload to VM (Windows)
```powershell
cd deployment
.\deploy-upload.ps1
```

## 🔐 SSH into VM (Git Bash/WSL)
```bash
ssh -i mocktest.pem ubuntu@34.180.47.20
```

## 🚀 Start Backend (On VM)
```bash
cd ~/backend
chmod +x *.sh
./start-backend.sh
```

## 🛑 Stop Backend (On VM)
```bash
./stop-backend.sh
```

## ✅ Health Check
```bash
# From VM
curl http://localhost:8080/actuator/health

# From anywhere
curl http://34.180.47.20:8080/actuator/health
```

## 📊 View Logs (On VM)
```bash
tail -f logs/application.log
```

## 🔄 Restart Backend (On VM)
```bash
./stop-backend.sh && ./start-backend.sh
```

## 🌐 Access URLs
- **Backend API**: http://34.180.47.20:8080
- **Health Check**: http://34.180.47.20:8080/actuator/health
- **API Docs**: http://34.180.47.20:8080/api

---

## ⚠️ Before Deploying

1. ✅ Ensure Docker services are running on VM:
   ```bash
   docker ps
   ```
   Should show: postgres, redis, rabbitmq

2. ✅ Configure GCP Firewall (if not done):
   - Allow TCP port 8080 from 0.0.0.0/0

3. ✅ Update frontend to use new backend:
   ```
   REACT_APP_API_URL=http://34.180.47.20:8080/api
   ```

---

## 🐛 Troubleshooting

**Can't connect to backend:**
- Check firewall rules in GCP Console
- Verify backend is running: `ps aux | grep java`
- Check logs: `tail -f logs/application.log`

**Database connection failed:**
- Check PostgreSQL: `docker ps | grep postgres`
- Restart: `docker restart exam-portal-postgres`

**Out of memory:**
- Edit `start-backend.sh`
- Increase: `-Xmx2048m` to `-Xmx4096m`

---

## 📞 Need Help?
See **README.md** for detailed instructions.
