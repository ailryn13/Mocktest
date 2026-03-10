# Quick SSH to GCP VM
# Usage: .\ssh-to-vm.ps1

param(
    [string]$VMUser = "ubuntu",
    [string]$VMIP = "34.180.47.20",
    [string]$KeyFile = "mocktest.pem"
)

if (-not (Test-Path $KeyFile)) {
    Write-Host "⚠️  SSH key not found: $KeyFile" -ForegroundColor Red
    Write-Host "Please ensure $KeyFile exists in this directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "🔐 Connecting to VM: $VMIP" -ForegroundColor Cyan
Write-Host ""

ssh -i $KeyFile -o StrictHostKeyChecking=no "$VMUser@$VMIP"
