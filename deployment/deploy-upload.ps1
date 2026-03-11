# Quick Deploy Script for Windows
# Uploads backend files to GCP VM using SCP

param(
    [string]$VMUser = "ubuntu",
    [string]$VMIP = "34.180.47.20",
    [string]$KeyFile = "..\mocktest.pem"
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Exam Portal - Deploy to GCP VM          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if key file exists
if (-not (Test-Path $KeyFile)) {
    Write-Host "✗ SSH key not found: $KeyFile" -ForegroundColor Red
    Write-Host "`nPlease provide the correct path to your SSH key:" -ForegroundColor Yellow
    Write-Host "  .\deploy-upload.ps1 -KeyFile 'path\to\your\key.pem'" -ForegroundColor White
    exit 1
}

Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  Target VM: $VMIP" -ForegroundColor White
Write-Host "  User: $VMUser" -ForegroundColor White
Write-Host "  Key: $KeyFile`n" -ForegroundColor White

# Check if SCP is available
$scpAvailable = Get-Command scp -ErrorAction SilentlyContinue

if (-not $scpAvailable) {
    Write-Host "⚠️  SCP not found in PATH" -ForegroundColor Yellow
    Write-Host "`nOptions to upload files:" -ForegroundColor Cyan
    Write-Host "  1. Install OpenSSH Client (Windows Settings > Apps > Optional Features)" -ForegroundColor White
    Write-Host "  2. Use WinSCP: https://winscp.net/download" -ForegroundColor White
    Write-Host "  3. Use FileZilla: https://filezilla-project.org/download.php" -ForegroundColor White
    Write-Host "`nManual upload instructions:" -ForegroundColor Yellow
    Write-Host "  - Connect to: $VMIP" -ForegroundColor White
    Write-Host "  - User: $VMUser" -ForegroundColor White
    Write-Host "  - Upload all files from: $(Resolve-Path .)\*" -ForegroundColor White
    Write-Host "  - To directory: /home/$VMUser/backend/`n" -ForegroundColor White
    
    # Open deployment folder
    Write-Host "Opening deployment folder..." -ForegroundColor Cyan
    Start-Process explorer.exe (Resolve-Path .)
    exit 0
}

Write-Host "📤 Uploading files to VM..." -ForegroundColor Cyan

try {
    # Create backend directory on VM
    Write-Host "`n  Creating backend directory on VM..." -ForegroundColor Yellow
    & ssh -i $KeyFile -o StrictHostKeyChecking=no "$VMUser@$VMIP" "mkdir -p ~/backend/config"
    
    # Upload JAR file
    Write-Host "  Uploading JAR (113 MB)..." -ForegroundColor Yellow
    & scp -i $KeyFile -o StrictHostKeyChecking=no "exam-portal-backend-1.0.0.jar" "${VMUser}@${VMIP}:~/backend/"
    
    # Upload configuration
    Write-Host "  Uploading configuration..." -ForegroundColor Yellow
    & scp -i $KeyFile -o StrictHostKeyChecking=no "application-production.yml" "${VMUser}@${VMIP}:~/backend/config/"
    
    # Upload scripts
    Write-Host "  Uploading startup scripts..." -ForegroundColor Yellow
    & scp -i $KeyFile -o StrictHostKeyChecking=no "start-backend.sh" "${VMUser}@${VMIP}:~/backend/"
    & scp -i $KeyFile -o StrictHostKeyChecking=no "stop-backend.sh" "${VMUser}@${VMIP}:~/backend/"
    
    Write-Host "`n✓ Files uploaded successfully!" -ForegroundColor Green
    
    Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║         Upload Complete!                   ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. SSH into your VM:" -ForegroundColor White
    Write-Host "     ssh -i $KeyFile $VMUser@$VMIP`n" -ForegroundColor Gray
    
    Write-Host "  2. Navigate to backend directory:" -ForegroundColor White
    Write-Host "     cd ~/backend`n" -ForegroundColor Gray
    
    Write-Host "  3. Make scripts executable:" -ForegroundColor White
    Write-Host "     chmod +x start-backend.sh stop-backend.sh`n" -ForegroundColor Gray
    
    Write-Host "  4. Start the backend:" -ForegroundColor White
    Write-Host "     ./start-backend.sh`n" -ForegroundColor Gray
    
    Write-Host "  5. Verify deployment:" -ForegroundColor White
    Write-Host "     curl http://localhost:8080/actuator/health`n" -ForegroundColor Gray
    
    Write-Host "See README.md for complete instructions.`n" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n✗ Upload failed: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Verify VM is running and accessible" -ForegroundColor White
    Write-Host "  - Check SSH key permissions" -ForegroundColor White
    Write-Host "  - Ensure firewall allows SSH (port 22)" -ForegroundColor White
    exit 1
}
