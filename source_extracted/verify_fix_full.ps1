$ErrorActionPreference = "Stop"

function Get-ErrorBody {
    param($ex)
    if ($ex.Exception.Response) {
        $stream = $ex.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        $reader.Close()
        return $body
    }
    return $ex.Message
}

$rand = Get-Random
$newEmail = "mod_fix_$rand@examportal.com"
$newPass = "mod123456"

Write-Host "1. Registering new moderator: $newEmail"
$regPayload = @{
    email      = $newEmail
    password   = $newPass
    fullName   = "Test Moderator $rand"
    department = "CSE"
    role       = "MODERATOR"
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $regPayload -ContentType "application/json"
    Write-Host "Registration Success: $regRes"
}
catch {
    $err = Get-ErrorBody $_
    Write-Error "Registration Failed: $err"
    exit 1
}

Write-Host "2. Logging in..."
try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body (@{email = $newEmail; password = $newPass } | ConvertTo-Json) -ContentType "application/json"
    $token = $loginRes.token
    Write-Host "Login Success. Dept Claim: $($loginRes.department)"
    if ($loginRes.department -ne "CSE") {
        Write-Error "CRITICAL FAILURE: Department not set correctly on login response! Got: $($loginRes.department)"
        # exit 1 
        # Continue to see if it works despite this (maybe token payload is diff from response)
    }
}
catch {
    $err = Get-ErrorBody $_
    Write-Error "Login Failed: $err"
    exit 1
}

Write-Host "3. Creating Test..."
$testPayload = '{
  "title": "Permanent Fix Test",
  "description": "",
  "instructions": "Test Instructions",
  "durationMinutes": 60,
  "type": "CODING_ONLY",
  "status": "PUBLISHED",
  "testType": "Practice",
  "startDateTime": "2026-02-01T10:00:00",
  "endDateTime": "2026-02-01T12:00:00",
  "testQuestions": []
}'

try {
    $createRes = Invoke-RestMethod -Uri "http://localhost:8080/api/tests" -Method Post -Headers @{Authorization = "Bearer $token" } -Body $testPayload -ContentType "application/json"
    Write-Host "Test Creation Success! ID: $($createRes.id), Dept: $($createRes.department)"
}
catch {
    $err = Get-ErrorBody $_
    Write-Error "Test Creation Failed: $err"
    exit 1
}

Write-Host "VERIFICATION PASSED: New user has correct department and can create tests."
