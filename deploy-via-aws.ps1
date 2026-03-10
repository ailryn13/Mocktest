# Production Deployment Script via AWS CLI
# This script uses AWS CLI to execute commands on the production server

Write-Host "`n=== Mocktest Production Deployment ===" -ForegroundColor Cyan
Write-Host "Instance: i-09fb61c358c3f620b (52.66.218.95)`n" -ForegroundColor Yellow

# Step 1: Pull latest images
Write-Host "[Step 1/4] Pulling latest Docker images from Docker Hub..." -ForegroundColor Cyan
$pullCommand = @"
cd /home/ubuntu/Mocktest && \
docker compose -f docker-compose.hub.yml pull backend frontend && \
echo 'Images pulled successfully'
"@

Write-Host "Executing remote command via manual SSH..." -ForegroundColor Yellow
Write-Host "`nYou need to manually SSH to the server and run these commands:" -ForegroundColor Red
Write-Host "`n--- COPY THESE COMMANDS ---" -ForegroundColor Green
Write-Host "cd ~/Mocktest" -ForegroundColor White
Write-Host "docker compose -f docker-compose.hub.yml pull backend frontend" -ForegroundColor White
Write-Host "docker compose -f docker-compose.hub.yml up -d --force-recreate backend frontend" -ForegroundColor White
Write-Host "docker compose -f docker-compose.hub.yml logs --tail=50 backend" -ForegroundColor White
Write-Host "--- END COMMANDS ---`n" -ForegroundColor Green

Write-Host "`nTO SSH TO THE SERVER, you need ONE of these:" -ForegroundColor Yellow
Write-Host "1. AWS Console EC2 Instance Connect:" -ForegroundColor Cyan
Write-Host "   https://ap-south-1.console.aws.amazon.com/ec2/home?region=ap-south-1#ConnectToInstance:instanceId=i-09fb61c358c3f620b" -ForegroundColor White
Write-Host "`n2. Find the 'mocktest.pem' file and run:" -ForegroundColor Cyan
Write-Host "   C:\Windows\System32\OpenSSH\ssh.exe -i `"path\to\mocktest.pem`" ubuntu@52.66.218.95" -ForegroundColor White
Write-Host "`n3. Contact team member with server access" -ForegroundColor Cyan

Write-Host "`nAfter deployment, test with:" -ForegroundColor Yellow
Write-Host "   .\test-production-login.ps1`n" -ForegroundColor White
