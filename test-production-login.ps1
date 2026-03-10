# Test Production Login Script
# Run this AFTER deploying to production

Write-Host "Testing production login..." -ForegroundColor Cyan

$body = @{
    email = "superadmin@mocktest.app"
    password = "SuperAdmin@123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'https://mock-test.duckdns.org/api/auth/login' `
        -Method POST `
        -ContentType 'application/json' `
        -Body $body `
        -UseBasicParsing

    Write-Host "✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Token received with role: $($content.role)" -ForegroundColor Green
    Write-Host "Full response:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ FAILED! Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
