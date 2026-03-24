#!/bin/bash
# Production Deployment Script for Mocktest Application
# Run this on the production server (ubuntu@52.66.218.95)

echo "=== Starting Mocktest Production Deployment ==="
echo "Time: $(date)"
echo ""

# Navigate to project directory
cd ~/Mocktest || { echo "ERROR: Mocktest directory not found"; exit 1; }

echo "Step 1: Pulling latest Docker images from Docker Hub..."
docker compose -f docker-compose.hub.yml pull backend frontend
if [ $? -eq 0 ]; then
    echo "✅ Images pulled successfully"
else
    echo "❌ Failed to pull images"
    exit 1
fi

echo ""
echo "Step 2: Restarting containers with new images..."
docker compose -f docker-compose.hub.yml up -d --force-recreate backend frontend
if [ $? -eq 0 ]; then
    echo "✅ Containers restarted successfully"
else
    echo "❌ Failed to restart containers"
    exit 1
fi

echo ""
echo "Step 3: Checking container status..."
sleep 5
docker compose -f docker-compose.hub.yml ps

echo ""
echo "Step 4: Checking backend logs..."
docker compose -f docker-compose.hub.yml logs --tail=50 backend

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Test login at: https://mock-test.duckdns.org/api/auth/login"
echo "2. Credentials: superadmin@mocktest.app / SuperAdmin@123456"
echo "3. If login still fails, run the database fix:"
echo "   docker exec mocktest-postgres-1 psql -U postgres -d mocktest_db -c \"UPDATE users SET password=password_hash WHERE email='superadmin@mocktest.app';\""
