param($VMUser="ubuntu",$VMIP="34.180.47.20",$KeyFile="mocktest.pem")
$ErrorActionPreference="Stop"
Write-Host "Deploying to $VMIP"
if (!(Test-Path $KeyFile)) { Write-Host "Key not found"; exit 1 }
git add .
git commit -m "GCP Deploy" -ErrorAction SilentlyContinue
git push origin main
$cmds = "cd Mocktest || git clone https://github.com/ailryn13/Mocktest.git Mocktest; cd Mocktest; git pull origin main; cp .env.gcp .env; docker-compose -f docker-compose.gcp.yml down; docker-compose -f docker-compose.gcp.yml up -d --build; sleep 5; docker-compose -f docker-compose.gcp.yml ps"
$f = [System.IO.Path]::GetTempFileName()
Set-Content $f $cmds
Get-Content $f | ssh -i $KeyFile -o StrictHostKeyChecking=no "$VMUser@$VMIP" "bash -s"
Remove-Item $f
Write-Host "Done"
