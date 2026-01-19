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

Write-Host "Logging in as moderator to check tests..."
try {
    # Login as the new moderator we created, or the standard one
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body (@{email = "moderator@examportal.com"; password = "moderator123" } | ConvertTo-Json) -ContentType "application/json"
    $token = $response.token
}
catch {
    Write-Error "Login failed: $(Get-ErrorBody $_)"
    exit 1
}

Write-Host "Fetching all tests..."
try {
    $tests = Invoke-RestMethod -Uri "http://localhost:8080/api/tests" -Method Get -Headers @{Authorization = "Bearer $token" }
    
    Write-Host "Found $($tests.Count) tests."
    $tests | ForEach-Object { 
        Write-Host "ID: $($_.id) | Title: '$($_.title)' | Dept: '$($_.department)' | Status: $($_.status)" 
    }
    
    $duplicates = $tests | Group-Object title | Where-Object { $_.Count -gt 1 }
    if ($duplicates) {
        Write-Host "`nWARNING: Duplicate Titles Found:" -ForegroundColor Yellow
        $duplicates | ForEach-Object {
            Write-Host "Title '$($_.Name)' appears $($_.Count) times."
        }
    }
    else {
        Write-Host "`nNo duplicate titles found." -ForegroundColor Green
    }

}
catch {
    Write-Error "Fetch failed: $(Get-ErrorBody $_)"
    exit 1
}
