$ErrorActionPreference = "Stop"

Write-Host "Comprehensive cleanup for test2..." -ForegroundColor Cyan
Write-Host ""

# Clear student attempts
$query1 = @"
DELETE FROM student_attempts 
WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2');
"@

# Clear proctoring violations
$query2 = @"
DELETE FROM proctoring_logs 
WHERE attempt_id IN (
    SELECT id FROM student_attempts 
    WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2')
);
"@

# Combined query to clear both
$combinedQuery = @"
-- Clear proctoring logs first (foreign key dependency)
DELETE FROM proctoring_logs 
WHERE attempt_id IN (
    SELECT id FROM student_attempts 
    WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2')
);

-- Then clear attempts
DELETE FROM student_attempts 
WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2');

-- Verify cleanup
SELECT 'Remaining attempts for test2:' as info, COUNT(*) as count 
FROM student_attempts 
WHERE test_id IN (SELECT id FROM tests WHERE title = 'test2');
"@

Write-Host "Executing cleanup..." -ForegroundColor Yellow
try {
    $result = docker exec exam-portal-postgres psql -U examuser -d examdb -c $combinedQuery
    Write-Host $result
    Write-Host ""
    Write-Host "Cleanup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You must now:" -ForegroundColor Yellow
    Write-Host "1. Close the test page completely (don't just refresh)" -ForegroundColor White
    Write-Host "2. Go back to the Student Dashboard" -ForegroundColor White
    Write-Host "3. Click 'Start Test' again" -ForegroundColor White
    Write-Host "4. It should now show 'Attempt 1' with no violations" -ForegroundColor White
}
catch {
    Write-Error "Failed: $_"
    exit 1
}
