# build-and-push.ps1
# Automates building and pushing Docker images to AWS ECR

# Configure these variables or set them as environment variables
$AWS_ACCOUNT_ID = $env:AWS_ACCOUNT_ID
$AWS_REGION = $env:AWS_REGION
$BACKEND_REPO = "exam-portal-backend"
$FRONTEND_REPO = "exam-portal-frontend"

if (-not $AWS_ACCOUNT_ID -or -not $AWS_REGION) {
    Write-Error "Please set AWS_ACCOUNT_ID and AWS_REGION environment variables."
    exit 1
}

$ECR_BASE = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

Write-Host "--- Logging into AWS ECR ---" -ForegroundColor Cyan
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_BASE

Write-Host "--- Building and Pushing Backend ---" -ForegroundColor Cyan
docker build -t $BACKEND_REPO ./backend
docker tag "$($BACKEND_REPO):latest" "$ECR_BASE/$($BACKEND_REPO):latest"
docker push "$ECR_BASE/$($BACKEND_REPO):latest"

Write-Host "--- Building and Pushing Frontend ---" -ForegroundColor Cyan
docker build -t $FRONTEND_REPO ./frontend
docker tag "$($FRONTEND_REPO):latest" "$ECR_BASE/$($FRONTEND_REPO):latest"
docker push "$ECR_BASE/$($FRONTEND_REPO):latest"

Write-Host "--- Successfully pushed images to ECR ---" -ForegroundColor Green
