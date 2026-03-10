#!/bin/bash
set -e
PROJECT=/home/ubuntu/Mocktest
BASE="$PROJECT/src/main/java/com/mocktest"

# Copy all updated Java files
cp /tmp/Exam.java             "$BASE/models/Exam.java"
cp /tmp/ExamRequest.java      "$BASE/dto/exam/ExamRequest.java"
cp /tmp/ExamResponse.java     "$BASE/dto/exam/ExamResponse.java"
cp /tmp/ExamServiceImpl.java  "$BASE/service/impl/ExamServiceImpl.java"
cp /tmp/QuestionService.java  "$BASE/service/QuestionService.java"
echo "All Java files copied to project"

# Rebuild backend
cd "$PROJECT"
docker build -t ganesh200504/mocktest-backend:latest .
echo "Backend image built"

# Rebuild frontend
docker build -t ganesh200504/mocktest-frontend:latest ./frontend
echo "Frontend image built"

# Restart both services
docker compose up -d backend frontend
echo "Services restarted"
echo "DEPLOY_COMPLETE"
