#!/bin/bash
# Move java and dd exam start times to now so students can see them
docker exec mocktest-postgres-1 psql -U postgres -d mocktest_db -c "
UPDATE exams SET start_time = NOW() - INTERVAL '1 minute' WHERE title = 'java';
UPDATE exams SET start_time = NOW() - INTERVAL '1 minute' WHERE title = 'dd';
SELECT id, title, exam_type, start_time, end_time FROM exams ORDER BY id;
"
