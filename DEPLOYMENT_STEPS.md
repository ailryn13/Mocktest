# Mocktest Deployment Guide - AWS

## Step 1: Open AWS Console
- Go to: https://console.aws.amazon.com
- Login with your AWS account

## Step 2: Go to EC2
- Click: Services → EC2
- Click: Instances (left menu)
- Find instance with IP: 3.222.6.232

## Step 3: Connect to Instance
- Click on the instance
- Click: "Connect" button (top right)
- Choose tab: "Session Manager"
- Click: "Connect" button

You should see a terminal window open!

## Step 4: Copy & Paste These Commands ONE BY ONE

### Command 1: Create directory
```
mkdir -p /home/ubuntu/mocktest && cd /home/ubuntu/mocktest
```

### Command 2: Pull Docker images
```
docker pull ganesh200504/mocktest-backend:latest
docker pull ganesh200504/mocktest-frontend:latest
```

### Command 3: Create docker-compose.yml
```
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: exam_portal_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  judge0-db:
    image: postgres:13
    restart: unless-stopped
    environment:
      POSTGRES_DB: judge0
      POSTGRES_USER: judge0
      POSTGRES_PASSWORD: judge0
    volumes:
      - judge0data:/var/lib/postgresql/data

  judge0-redis:
    image: redis:6.0
    restart: unless-stopped

  judge0-server:
    image: judge0/judge0:1.13.1
    command: ["./scripts/server"]
    restart: unless-stopped
    privileged: true
    pid: host
    environment:
      POSTGRES_NAME: judge0
      POSTGRES_USER: judge0
      POSTGRES_PASSWORD: judge0
      POSTGRES_HOST: judge0-db
      REDIS_HOST: judge0-redis
      REDIS_PORT: 6379
      MAX_QUEUE_SIZE: "100"
      MAX_WALL_TIME_LIMIT: "10.0"
    depends_on:
      - judge0-db
      - judge0-redis

  backend:
    image: ganesh200504/mocktest-backend:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/exam_portal_db
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      MAIL_HOST: smtp.gmail.com
      MAIL_PORT: "587"
      MAIL_USERNAME: ganeshkumarngk2005@gmail.com
      MAIL_PASSWORD: xkfjctziwrvcywso
      MAIL_FROM_NAME: MockTest Platform
      FRONTEND_URL: https://mock-test.duckdns.org
      CORS_ALLOWED_ORIGINS: "https://mock-test.duckdns.org"
      APP_JWT_SECRET: bXktc3VwZXItc2VjcmV0LWtleS1mb3ItbW9ja3Rlc3QtcGxhdGZvcm0tMjAyNi1qd3Q=
      JWT_SECRET: bXktc3VwZXItc2VjcmV0LWtleS1mb3ItbW9ja3Rlc3QtcGxhdGZvcm0tMjAyNi1qd3Q=
      APP_JUDGE0_API_URL: http://judge0-server:2358
      JAVA_OPTS: "-Xmx512m -Xms256m"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: ganesh200504/mocktest-frontend:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
    depends_on:
      - backend

volumes:
  pgdata:
  judge0data:
EOF
```

### Command 4: Stop old containers
```
docker-compose down
```

### Command 5: Start new containers
```
docker-compose up -d
```

### Command 6: Check status
```
docker-compose ps
```

### Command 7: Check backend is running
```
docker-compose logs backend --tail 20
```

## Step 5: Access Your Application

After all containers are running (wait ~2-3 minutes):

- **Frontend**: `https://mock-test.duckdns.org` (or `http://3.222.6.232:3000`)
- **Backend API**: `http://3.222.6.232:8080`
- **Test Health**: `curl http://localhost:8080/api/health`

## Step 6: Login & Test

Use these credentials:
- **Email**: dhinesh2004@gmail.com (Student)
- **Password**: Check database or reset it

Or use:
- **Email**: superadmin@mocktest.app (Super Admin)
- **Password**: Check database

## Troubleshooting

If containers fail to start:
```
docker-compose logs -f
```

To see all containers:
```
docker ps -a
```

To restart all:
```
docker-compose restart
```

---

That's it! Your application will be live on AWS!
