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

Write-Host "Attempting login as MODERATOR..."
try {
  $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body (@{email = "moderator@examportal.com"; password = "moderator123" } | ConvertTo-Json) -ContentType "application/json"
  $token = $response.token
  Write-Host "Token obtained."
}
catch {
  $err = Get-ErrorBody $_
  Write-Error "Login failed. Body: $err"
  exit 1
}

$payload = '{
  "title": "test2",
  "description": "",
  "instructions": "Please answer all questions carefully.",
  "durationMinutes": 60,
  "type": "CODING_ONLY",
  "status": "PUBLISHED",
  "testType": "Placement Drive",
  "startDateTime": "2025-01-19T13:35:00",
  "endDateTime": "2026-01-25T03:59:00",
  "testQuestions": [
    {
      "questionId": 12,
      "marks": 5,
      "orderIndex": 1,
      "sectionName": "General"
    }
  ]
}'

Write-Host "Sending test creation request..."
try {
  $res = Invoke-RestMethod -Uri "http://localhost:8080/api/tests" -Method Post -Headers @{Authorization = "Bearer $token" } -Body $payload -ContentType "application/json"
  Write-Host "Success: $($res | ConvertTo-Json)"
}
catch {
  Write-Host "Caught Exception on Create Test"
  $err = Get-ErrorBody $_
  Write-Host "Error Response Body: $err"
  $err | Out-File "last_error.json" -Encoding UTF8
}
