import re

path = '/home/ubuntu/Mocktest/docker-compose.yml'
with open(path, 'r') as f:
    c = f.read()

# 1. Replace build section with prebuilt fixed image
c = re.sub(
    r'  backend:\n    build:\n      context: \.\n      dockerfile: Dockerfile',
    '  backend:\n    image: ganesh200504/mocktest-backend:latest',
    c
)

# 2. Add APP_JUDGE0_API_URL if not already present
if 'APP_JUDGE0_API_URL' not in c:
    c = c.replace(
        '      FRONTEND_URL: https://mock-test.duckdns.org',
        '      FRONTEND_URL: https://mock-test.duckdns.org\n      APP_JUDGE0_API_URL: http://judge0-v1131-server-1:2358'
    )

with open(path, 'w') as f:
    f.write(c)

print("docker-compose.yml updated successfully")

# Verify
with open(path, 'r') as f:
    content = f.read()
if 'ganesh200504/mocktest-backend:latest' in content:
    print("OK: backend image set to ganesh200504/mocktest-backend:latest")
if 'APP_JUDGE0_API_URL' in content:
    print("OK: APP_JUDGE0_API_URL configured")
