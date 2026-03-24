# GCP Deployment Script
# Builds and pushes Docker images to Google Container Registry

param(
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = $env:GCP_REGION
)

if (-not $ProjectId) {
    Write-Error "Please set GCP_PROJECT_ID environment variable or provide -ProjectId parameter."
    exit 1
}

$GCR_BASE = "gcr.io/$ProjectId"

Write-Host "--- Authenticating with GCP ---" -ForegroundColor Cyan
gcloud auth configure-docker

Write-Host "`n--- Building Backend Image ---" -ForegroundColor Cyan
docker build -t $GCR_BASE/exam-portal-backend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend build failed"
    exit 1
}

Write-Host "`n--- Building Frontend Image ---" -ForegroundColor Cyan
docker build -t $GCR_BASE/exam-portal-frontend:latest ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed"
    exit 1
}

Write-Host "`n--- Pushing Backend to GCR ---" -ForegroundColor Cyan
docker push $GCR_BASE/exam-portal-backend:latest

Write-Host "`n--- Pushing Frontend to GCR ---" -ForegroundColor Cyan
docker push $GCR_BASE/exam-portal-frontend:latest

Write-Host "`n✅ All images pushed successfully to Google Container Registry!" -ForegroundColor Green
Write-Host "Backend: $GCR_BASE/exam-portal-backend:latest" -ForegroundColor White
Write-Host "Frontend: $GCR_BASE/exam-portal-frontend:latest" -ForegroundColor White
