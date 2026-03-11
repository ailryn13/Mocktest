$ErrorActionPreference = "Stop"

# Login
$loginBody = '{"email":"student1@test.com","password":"student123"}'
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST `
    -Body $loginBody -ContentType "application/json"
Write-Host "Login OK"

# Run code
$runBody = @{
    sourceCode = 'public class Main { public static void main(String[] args) { System.out.println("Hello from Judge0!"); } }'
    language   = "java"
    stdin      = ""
    questionId = 1
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:8080/api/student/code/run" -Method POST `
    -Body $runBody -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $($login.token)" }

Write-Host "--- Result ---"
$result | ConvertTo-Json -Depth 5
