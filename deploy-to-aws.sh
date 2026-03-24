#!/bin/bash
# AWS Deployment Script for Mocktest
# Usage: ./deploy-to-aws.sh

SSH_KEY="C:\\Users\\ganes\\OneDrive\\Desktop\\mocktest.pem"
AWS_SERVER="3.222.6.232"
AWS_USER="ubuntu"
WORKSPACE="/home/ubuntu/mocktest"

echo "🚀 Deploying Mocktest to AWS..."
echo "Server: $AWS_SERVER"
echo "User: $AWS_USER"
echo ""

# Step 1: Create workspace directory
echo "📁 Creating workspace..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_SERVER" "mkdir -p $WORKSPACE && cd $WORKSPACE && pwd"

# Step 2: Copy docker-compose file
echo "📋 Copying docker-compose.aws.yml..."
scp -i "$SSH_KEY" docker-compose.aws.yml "$AWS_USER@$AWS_SERVER":"$WORKSPACE/docker-compose.yml"

# Step 3: Stop old containers
echo "🛑 Stopping old containers..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_SERVER" "cd $WORKSPACE && docker-compose down 2>/dev/null || true"

# Step 4: Pull latest images
echo "📥 Pulling latest images..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_SERVER" "docker pull ganesh200504/mocktest-backend:latest && docker pull ganesh200504/mocktest-frontend:latest"

# Step 5: Start containers
echo "🚀 Starting containers..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_SERVER" "cd $WORKSPACE && docker-compose up -d"

# Step 6: Check status
echo "✅ Checking container status..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_SERVER" "cd $WORKSPACE && docker-compose ps"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Access your application:"
echo "  Frontend: https://mock-test.duckdns.org"
echo "  Backend:  http://3.222.6.232:8080"
echo "  API:      http://3.222.6.232:8080/api"
echo ""
