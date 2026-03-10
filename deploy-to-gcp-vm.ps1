# Deploy to GCP Compute Engine VM
# VM IP: 34.180.47.20

param(
    [string]$VMUser = "ubuntu",
    [string]$VMIP = "34.180.47.20",
    [string]$KeyFile = "mocktest.pem"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying to GCP Compute Engine VM ===" -ForegroundColor Cyan
Write-Host "VM IP: $VMIP" -ForegroundColor White
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $KeyFile)) {
    Write-Host "⚠️  SSH key not found: $KeyFile" -ForegroundColor Yellow
    Write-Host "Please provide the correct path to your SSH key file." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Step 1: Pushing latest code to GitHub..." -ForegroundColor Cyan
git add .
git commit -m "Deploy: Update configuration for GCP VM" -ErrorAction SilentlyContinue
git push origin main

Write-Host ""
Write-Host "🚀 Step 2: Connecting to VM and deploying..." -ForegroundColor Cyan
Write-Host ""

# Create deployment commands
$deployCommands = @"
# Update repository
if [ -d "Mocktest" ]; then
    cd Mocktest
    git pull origin main
else
    git clone https://github.com/ailryn13/Mocktest.git
    cd Mocktest
fi

# Copy environment configuration
cp .env.gcp .env

# Stop existing containers
docker-compose down

# Pull latest images and start services
docker-compose up -d --build

# Wait a moment for services to start
sleep 10

# Show status
echo ""
echo "=== Service Status ==="
docker-compose ps

echo ""
echo "=== Recent Logs ==="
docker-compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo "Frontend: http://$VMIP:3000"
echo "Backend: http://$VMIP:8080"
"@

# Save commands to temporary file
$tmpFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tmpFile -Value $deployCommands

Write-Host "Executing deployment on VM..." -ForegroundColor Yellow

# Execute via SSH
ssh -i $KeyFile -o StrictHostKeyChecking=no "$VMUser@$VMIP" "bash -s" < $tmpFile

# Clean up
Remove-Item $tmpFile

Write-Host ""
Write-Host "✅ Deployment script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  Frontend: http://$VMIP:3000" -ForegroundColor White
Write-Host "  Backend:  http://$VMIP:8080/api" -ForegroundColor White
Write-Host ""
Write-Host "To view logs, SSH into the VM:" -ForegroundColor Yellow
Write-Host "  ssh -i $KeyFile $VMUser@$VMIP" -ForegroundColor White
Write-Host "  cd Mocktest && docker-compose logs -f" -ForegroundColor White
