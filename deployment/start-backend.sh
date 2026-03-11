#!/bin/bash

# Exam Portal Backend Startup Script for Production
# Run this on your GCP VM

set -e

APP_JAR="exam-portal-backend-1.0.0.jar"
APP_NAME="exam-portal-backend"
LOG_FILE="logs/application.log"
PID_FILE="backend.pid"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Starting Exam Portal Backend ===${NC}"

# Create logs directory
mkdir -p logs

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Backend is already running (PID: $PID)${NC}"
        echo "Use ./stop-backend.sh to stop it first."
        exit 1
    else
        echo "Removing stale PID file..."
        rm "$PID_FILE"
    fi
fi

# Start application
echo "Starting backend on port 8080..."
nohup java -jar \
    -Dspring.profiles.active=production \
    -Xms512m \
    -Xmx2048m \
    -XX:+UseG1GC \
    "$APP_JAR" > "$LOG_FILE" 2>&1 &

# Save PID
echo $! > "$PID_FILE"
PID=$(cat "$PID_FILE")

echo -e "${GREEN}✓ Backend started successfully!${NC}"
echo "  PID: $PID"
echo "  Log file: $LOG_FILE"
echo ""
echo "Waiting for application to start..."
sleep 10

# Check health
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
    echo ""
    echo "Backend is running at:"
    echo "  - Local: http://localhost:8080"
    echo "  - External: http://34.180.47.20:8080"
else
    echo -e "${RED}✗ Health check failed. Check logs:${NC}"
    echo "  tail -f $LOG_FILE"
fi

echo ""
echo "To view logs: tail -f $LOG_FILE"
echo "To stop: ./stop-backend.sh"
