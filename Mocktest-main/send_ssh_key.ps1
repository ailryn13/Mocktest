
# AWS EC2 Instance Connect - send-ssh-public-key via SigV4 signed HTTP request
# No aws.exe needed

$AWS_ACCESS_KEY  = $env:AWS_ACCESS_KEY_ID
$AWS_SECRET_KEY  = $env:AWS_SECRET_ACCESS_KEY
$AWS_REGION      = "ap-south-1"

$INSTANCE_ID     = "i-09fb61c358c3f620b"
$OS_USER         = "ubuntu"
$AZ              = "ap-south-1c"
$SSH_PUB_KEY     = (Get-Content "$env:TEMP\ec2key.pub" -Raw).Trim()

$service         = "ec2-instance-connect"
$endpoint        = "https://ec2-instance-connect.$AWS_REGION.amazonaws.com"
$target          = "AWSEC2InstanceConnectService.SendSSHPublicKey"

# Payload
$bodyObj = @{
    InstanceId       = $INSTANCE_ID
    InstanceOSUser   = $OS_USER
    SSHPublicKey     = $SSH_PUB_KEY
    AvailabilityZone = $AZ
}
$body = $bodyObj | ConvertTo-Json -Compress

# Helper functions for SigV4
function Invoke-HmacSha256([byte[]]$key, [string]$data) {
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = $key
    return $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($data))
}

function Get-Sha256Hash([string]$data) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $bytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($data))
    return ([BitConverter]::ToString($bytes) -replace '-','').ToLower()
}

function ConvertTo-HexString([byte[]]$bytes) {
    return ([BitConverter]::ToString($bytes) -replace '-','').ToLower()
}

$now = [DateTime]::UtcNow
$amzDate = $now.ToString("yyyyMMddTHHmmssZ")
$dateStamp = $now.ToString("yyyyMMdd")

$payloadHash = Get-Sha256Hash $body

$headers = [ordered]@{
    "content-type"   = "application/x-amz-json-1.1"
    "host"           = "ec2-instance-connect.$AWS_REGION.amazonaws.com"
    "x-amz-date"     = $amzDate
    "x-amz-target"   = $target
}

$signedHeaders = ($headers.Keys -join ";")

$canonicalHeaders = ""
foreach ($k in $headers.Keys) {
    $canonicalHeaders += "$k`:$($headers[$k])`n"
}

$canonicalRequest = "POST`n/`n`n$canonicalHeaders`n$signedHeaders`n$payloadHash"
$canonicalRequestHash = Get-Sha256Hash $canonicalRequest

$credentialScope = "$dateStamp/$AWS_REGION/$service/aws4_request"
$stringToSign = "AWS4-HMAC-SHA256`n$amzDate`n$credentialScope`n$canonicalRequestHash"

$kDate    = Invoke-HmacSha256 ([System.Text.Encoding]::UTF8.GetBytes("AWS4$AWS_SECRET_KEY")) $dateStamp
$kRegion  = Invoke-HmacSha256 $kDate $AWS_REGION
$kService = Invoke-HmacSha256 $kRegion $service
$kSigning = Invoke-HmacSha256 $kService "aws4_request"

$signature = ConvertTo-HexString (Invoke-HmacSha256 $kSigning $stringToSign)

$authHeader = "AWS4-HMAC-SHA256 Credential=$AWS_ACCESS_KEY/$credentialScope, SignedHeaders=$signedHeaders, Signature=$signature"

$requestHeaders = @{
    "Content-Type"   = "application/x-amz-json-1.1"
    "X-Amz-Date"     = $amzDate
    "X-Amz-Target"   = $target
    "Authorization"  = $authHeader
}

Write-Host "Sending SSH key to EC2 Instance Connect..."
Write-Host "Endpoint: $endpoint"
Write-Host "Time: $amzDate"

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -Headers $requestHeaders -Body $body -ContentType "application/x-amz-json-1.1" -TimeoutSec 30
    Write-Host "SUCCESS: $($response | ConvertTo-Json)"
    $true | Out-File "c:\Users\ganes\OneDrive\Desktop\Mocktest-main\Mocktest-main\key_push_success.txt"
} catch {
    Write-Host "ERROR: $_"
    "$_" | Out-File "c:\Users\ganes\OneDrive\Desktop\Mocktest-main\Mocktest-main\key_push_error.txt"
}
