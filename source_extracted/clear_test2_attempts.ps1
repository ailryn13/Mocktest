$ErrorActionPreference = "Stop"

Write-Host "This script will clear all student attempts for 'test2' tests."
Write-Host "This will allow students to start fresh with 'Attempt 1'."
Write-Host ""

# Connect to PostgreSQL and delete attempts
$query = @"
DELETE FROM student_attempts 
WHERE test_id IN (
    SELECT id FROM tests WHERE title = 'test2'
);
"@

Write-Host "Executing SQL to clear attempts..."
try {
    docker exec exam-portal-postgres psql -U examuser -d examdb -c $query
    Write-Host "Successfully cleared all attempts for 'test2'!" -ForegroundColor Green
}
catch {
    Write-Error "Failed to clear attempts: $_"
    exit 1
}
