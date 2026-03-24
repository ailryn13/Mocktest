#!/bin/bash
# Direct database query to verify the question

docker-compose exec -T postgres psql -U postgres -d exam_portal_db << EOF
-- Get the question details
SELECT 
  q.id,
  q.content as problem_statement,
  q.test_cases,
  q.type,
  q.language
FROM questions q
WHERE id = 9;

-- Get the exam for this question  
SELECT e.id, e.name FROM exams e JOIN questions q ON e.id = q.exam_id WHERE q.id = 9;
EOF
