$ErrorActionPreference = "Stop"

$DOCKER_USER = "ganesh200504"
$TAG = "latest"

$BACKEND_IMAGE = $DOCKER_USER + "/" + "mocktest-backend" + ":" + $TAG
$FRONTEND_IMAGE = $DOCKER_USER + "/" + "mocktest-frontend" + ":" + $TAG
$DB_IMAGE = $DOCKER_USER + "/" + "mocktest-db" + ":" + $TAG
$REDIS_IMAGE = $DOCKER_USER + "/" + "mocktest-redis" + ":" + $TAG
$JUDGE0_IMAGE = $DOCKER_USER + "/" + "mocktest-judge0-engine" + ":" + $TAG

Write-Host "Starting Docker Hub builds for ALL 5 images..."

# 1. Build and Push Backend
Write-Host "Building Backend..."
docker build -t $BACKEND_IMAGE .
Write-Host "Pushing Backend..."
docker push $BACKEND_IMAGE

# 2. Build and Push Frontend
Write-Host "Building Frontend..."
docker build -t $FRONTEND_IMAGE ./frontend
Write-Host "Pushing Frontend..."
docker push $FRONTEND_IMAGE

# 3. Pull, Tag, and Push DB
Write-Host "Tagging and Pushing DB (Postgres)..."
docker pull postgres:15-alpine
docker tag postgres:15-alpine $DB_IMAGE
docker push $DB_IMAGE

# 4. Pull, Tag, and Push Redis
Write-Host "Tagging and Pushing Redis..."
docker pull redis:6.0
docker tag redis:6.0 $REDIS_IMAGE
docker push $REDIS_IMAGE

# 5. Pull, Tag, and Push Judge0
Write-Host "Tagging and Pushing Judge0 Engine..."
docker pull judge0/judge0:1.13.1
docker tag judge0/judge0:1.13.1 $JUDGE0_IMAGE
docker push $JUDGE0_IMAGE

Write-Host "Done! ALL 5 images are now updated in your Docker Hub."
