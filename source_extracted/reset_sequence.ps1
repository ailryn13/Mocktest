$ErrorActionPreference = "Stop"

Write-Host "Resetting student_attempts sequence to start from 1..." -ForegroundColor Cyan

# First, delete all existing attempts
$deleteQuery = "DELETE FROM student_attempts;"

# Then reset the sequence
$resetQuery = "ALTER SEQUENCE student_attempts_id_seq RESTART WITH 1;"

# Combined query
$combinedQuery = @"
-- Delete all attempts
DELETE FROM student_attempts;

-- Reset the sequence
ALTER SEQUENCE student_attempts_id_seq RESTART WITH 1;

-- Verify
SELECT 'Sequence reset complete. Next ID will be:' as info, nextval('student_attempts_id_seq') as next_id;
SELECT 'Rolling back the nextval check...' as info;
SELECT setval('student_attempts_id_seq', 1, false) as reset_to_1;
"@

Write-Host "Executing reset..." -ForegroundColor Yellow
try {
    $result = docker exec exam-portal-postgres psql -U examuser -d examdb -c $combinedQuery
    Write-Host $result
    Write-Host ""
    Write-Host "SUCCESS! The next attempt will be ID #1" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now:" -ForegroundColor Yellow
    Write-Host "1. Exit the current test (click Home)" -ForegroundColor White
    Write-Host "2. Refresh the browser" -ForegroundColor White
    Write-Host "3. Start test2 again" -ForegroundColor White
    Write-Host "4. It should now show 'Attempt 1'" -ForegroundColor White
}
catch {
    Write-Error "Failed: $_"
    exit 1
}
