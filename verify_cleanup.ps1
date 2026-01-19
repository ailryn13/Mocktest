$ErrorActionPreference = "Stop"

Write-Host "Verifying database state for test2..." -ForegroundColor Cyan

# First, let's see what test IDs exist for "test2"
$query1 = "SELECT id, title, department FROM tests WHERE title = 'test2';"

Write-Host "`nFetching test2 IDs..." -ForegroundColor Yellow
$testIds = docker exec exam-portal-postgres psql -U examuser -d examdb -t -c $query1
Write-Host $testIds

# Now check for any remaining attempts
$query2 = "SELECT id, test_id, student_id, status FROM student_attempts WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2');"

Write-Host "`nChecking for remaining attempts..." -ForegroundColor Yellow
$attempts = docker exec exam-portal-postgres psql -U examuser -d examdb -t -c $query2
Write-Host $attempts

if ($attempts -match "\d") {
    Write-Host "`nWARNING: Found existing attempts! Deleting now..." -ForegroundColor Red
    
    $deleteQuery = "DELETE FROM student_attempts WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2');"
    docker exec exam-portal-postgres psql -U examuser -d examdb -c $deleteQuery
    
    Write-Host "Attempts deleted. Verifying..." -ForegroundColor Green
    $verify = docker exec exam-portal-postgres psql -U examuser -d examdb -t -c $query2
    Write-Host $verify
    
    if ($verify -match "\d") {
        Write-Error "FAILED: Attempts still exist!"
    }
    else {
        Write-Host "`nSUCCESS: All attempts cleared!" -ForegroundColor Green
    }
}
else {
    Write-Host "`nNo attempts found - database is clean!" -ForegroundColor Green
}
