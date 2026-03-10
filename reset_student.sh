#!/bin/bash
# BCrypt hash for "student123"
HASH='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi'
docker exec mocktest-postgres-1 psql -U postgres -d mocktest_db -c "UPDATE users SET password_hash='${HASH}' WHERE email='dhinesh2004@gmail.com';"
echo "Done. Verifying..."
docker exec mocktest-postgres-1 psql -U postgres -d mocktest_db -c "SELECT id, email, role FROM users WHERE email='dhinesh2004@gmail.com';"
