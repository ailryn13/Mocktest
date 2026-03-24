#!/bin/bash

# GCP Deployment Script for Mocktest Exam Portal
# Deploys the application to Google Compute Engine

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mocktest GCP Deployment ===${NC}"

# Load environment variables
if [ -f .env.gcp ]; then
    export $(cat .env.gcp | grep -v '^#' | xargs)
fi

# Verify GCP project
echo -e "${BLUE}Current GCP Project: $(gcloud config get-value project)${NC}"

# Build and push images
echo -e "${BLUE}Building and pushing Docker images...${NC}"
./scripts/build-and-push-gcp.ps1

# Deploy to Compute Engine or Cloud Run
echo -e "${BLUE}Deploying application...${NC}"

# Option 1: Deploy to Cloud Run (Serverless)
echo -e "${BLUE}Do you want to deploy to Cloud Run? (y/n)${NC}"
read -r DEPLOY_CLOUD_RUN

if [ "$DEPLOY_CLOUD_RUN" = "y" ]; then
    # Deploy backend
    gcloud run deploy exam-backend \
        --image gcr.io/${GCP_PROJECT_ID}/exam-portal-backend:latest \
        --platform managed \
        --region ${GCP_REGION} \
        --allow-unauthenticated \
        --set-env-vars "SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
        --set-env-vars "SPRING_DATASOURCE_USERNAME=${DB_USERNAME}" \
        --set-env-vars "SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}"
    
    # Deploy frontend
    gcloud run deploy exam-frontend \
        --image gcr.io/${GCP_PROJECT_ID}/exam-portal-frontend:latest \
        --platform managed \
        --region ${GCP_REGION} \
        --allow-unauthenticated
    
    echo -e "${GREEN}✅ Deployed to Cloud Run successfully!${NC}"
else
    # Option 2: Deploy to Compute Engine
    echo -e "${BLUE}Deploying to Compute Engine instance...${NC}"
    echo -e "${RED}Please SSH into your instance and run:${NC}"
    echo "docker-compose -f docker-compose.gcp.yml pull"
    echo "docker-compose -f docker-compose.gcp.yml up -d"
fi

echo -e "${GREEN}=== Deployment Complete ===${NC}"
