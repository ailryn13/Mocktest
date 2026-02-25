# Docker Hub Push Script for Mocktest-main
# Username: ganesh200504

$DOCKER_USER = "ganesh200504"
$BACKEND_REPO = "exam-portal-backend"
$FRONTEND_REPO = "exam-portal-frontend"
$TAG = "latest"

Write-Host "🚀 Starting Docker Hub Build & Push Process..." -ForegroundColor Cyan

# Check if logged in (basic check)
try {
    docker system info | Select-String "Username"
}
catch {
    Write-Error "❌ Not logged in to Docker Hub. Please run 'docker login' first."
    exit 1
}

# Backend
Write-Host "📦 Building Backend Image..." -ForegroundColor Yellow
docker build -t "$DOCKER_USER/$BACKEND_REPO:$TAG" ./backend

# Frontend
Write-Host "📦 Building Frontend Image..." -ForegroundColor Yellow
docker build -t "$DOCKER_USER/$FRONTEND_REPO:$TAG" ./frontend

# Push Backend
Write-Host "📤 Pushing Backend to Docker Hub..." -ForegroundColor Yellow
docker push "$DOCKER_USER/$BACKEND_REPO:$TAG"

# Push Frontend
Write-Host "📤 Pushing Frontend to Docker Hub..." -ForegroundColor Yellow
docker push "$DOCKER_USER/$FRONTEND_REPO:$TAG"

Write-Host "✅ Successfully pushed all images to Docker Hub!" -ForegroundColor Green
Write-Host "Remote repositories:" -ForegroundColor White
Write-Host " - $DOCKER_USER/$BACKEND_REPO:$TAG"
Write-Host " - $DOCKER_USER/$FRONTEND_REPO:$TAG"
