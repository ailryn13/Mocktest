#!/bin/bash
cd /home/ubuntu/Mocktest

echo "Pulling latest frontend image..."
docker pull ganesh200504/exam-portal-frontend:latest

echo "Stopping current frontend..."
docker rm -f exam-portal-frontend

echo "Starting new frontend with MODERATOR fix..."
docker run -d \
  --name exam-portal-frontend \
  --network backend_exam-network \
  -p 3000:3000 \
  --restart unless-stopped \
  ganesh200504/exam-portal-frontend:latest

echo "Checking frontend status..."
docker ps | grep frontend

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Deployment complete!"
echo "Test at: https://mock-test.duckdns.org/login"
