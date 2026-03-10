#!/bin/bash
set -e

echo "=== EC2 Deploy Script ==="
echo "Copying files to project..."

PROJECT="/home/ubuntu/Mocktest"

# Copy files
cp /tmp/pom.xml "$PROJECT/pom.xml"
echo "✓ Copied pom.xml (with ANTLR4 plugin)"

cp /tmp/CodeCheck.g4 "$PROJECT/src/main/antlr4/com/mocktest/antlr/CodeCheck.g4"
echo "✓ Copied CodeCheck.g4"

cp /tmp/CodeConstraintChecker.java "$PROJECT/src/main/java/com/mocktest/service/CodeConstraintChecker.java"
echo "✓ Copied CodeConstraintChecker.java (interface)"

cp /tmp/CodeConstraintCheckerImpl.java "$PROJECT/src/main/java/com/mocktest/service/impl/CodeConstraintCheckerImpl.java"
echo "✓ Copied CodeConstraintCheckerImpl.java"

mkdir -p "$PROJECT/frontend/src/app/mediator/exams/create"
cp /tmp/create_page.tsx "$PROJECT/frontend/src/app/mediator/exams/create/page.tsx"
echo "✓ Copied create/page.tsx"

[ -f /tmp/api.ts ] && cp /tmp/api.ts "$PROJECT/frontend/src/lib/api.ts" && echo "✓ Copied api.ts"
[ -f /tmp/FrontendDockerfile ] && cp /tmp/FrontendDockerfile "$PROJECT/frontend/Dockerfile" && echo "✓ Copied frontend Dockerfile"

echo ""
echo "=== Building Backend Image ==="
cd "$PROJECT"
docker build -t ganesh200504/mocktest-backend:latest .
echo "✓ Backend image built"

echo ""
echo "=== Building Frontend Image ==="
docker build -t ganesh200504/mocktest-frontend:latest ./frontend
echo "✓ Frontend image built"

echo ""
echo "=== Restarting Containers ==="
docker compose up -d --no-deps backend frontend
echo "✓ Containers restarted"

echo ""
echo "=== Verifying Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Deploy Complete ==="
