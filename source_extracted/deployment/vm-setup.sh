#!/bin/bash
# Quick setup script for deployment on VM
# Run this on your GCP VM to create backend directory and prepare for deployment

echo "════════════════════════════════════════════════"
echo "  Preparing VM for Backend Deployment"
echo "════════════════════════════════════════════════"
echo ""

# Create backend directory
mkdir -p ~/backend/config
mkdir -p ~/backend/logs

echo "✓ Created backend directory structure:"
echo "  ~/backend/"
echo "  ~/backend/config/"
echo "  ~/backend/logs/"
echo ""

# Check if Docker services are running
echo "Checking Docker services..."
if command -v docker &> /dev/null; then
    echo ""
    echo "Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    # Check for required services
    if docker ps | grep -q postgres; then
        echo "✓ PostgreSQL is running"
    else
        echo "✗ PostgreSQL not found - you'll need to start it"
    fi
    
    if docker ps | grep -q redis; then
        echo "✓ Redis is running"
    else
        echo "✗ Redis not found - you'll need to start it"
    fi
    
    if docker ps | grep -q rabbitmq; then
        echo "✓ RabbitMQ is running"
    else
        echo "✗ RabbitMQ not found - you'll need to start it"
    fi
else
    echo "⚠️  Docker not found - please install Docker first"
fi

echo ""
echo "════════════════════════════════════════════════"
echo "  Next Steps:"
echo "════════════════════════════════════════════════"
echo ""
echo "1. Upload deployment files to ~/backend/"
echo "   - exam-portal-backend-1.0.0.jar"
echo "   - start-backend.sh"
echo "   - stop-backend.sh"
echo "   - application-production.yml (to config/)"
echo ""
echo "2. Make scripts executable:"
echo "   cd ~/backend"
echo "   chmod +x start-backend.sh stop-backend.sh"
echo ""
echo "3. Start the backend:"
echo "   ./start-backend.sh"
echo ""
echo "Ready for deployment!"
