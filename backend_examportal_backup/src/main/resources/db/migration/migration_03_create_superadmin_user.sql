-- Migration: Create SUPER_ADMIN Role and User
-- File: migration_03_create_superadmin_user.sql
-- Description: Creates the SUPER_ADMIN role and inserts the system administrator user

-- =====================================================
-- Step 1: Ensure SUPER_ADMIN role exists
-- =====================================================
INSERT INTO roles (name, description) 
VALUES ('SUPER_ADMIN', 'System-wide administrator with access to all colleges')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Step 2: Insert SUPER_ADMIN user
-- =====================================================
-- NOTE: Replace the password hash below with the actual BCrypt hash
-- To generate the hash for password "SuperAdmin@123456", run:
-- java -cp target/classes com.examportal.util.GeneratePassword SuperAdmin@123456
--
-- Or use this pre-generated BCrypt hash (for development/testing only):
-- Password: SuperAdmin@123456
-- BCrypt Hash: $2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm
--
-- IMPORTANT: For production, generate a new hash using the GeneratePassword utility!

INSERT INTO users (
    email, 
    first_name, 
    last_name, 
    password, 
    department, 
    enabled,
    created_at,
    updated_at
) VALUES (
    'superadmin@mocktest.app',
    'Super',
    'Admin',
    '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',  -- BCrypt hash of "SuperAdmin@123456"
    'System',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE 
SET password = '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',
    enabled = true,
    updated_at = NOW()
RETURNING id;

-- =====================================================
-- Step 3: Assign SUPER_ADMIN role to the user
-- =====================================================
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'superadmin@mocktest.app' 
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =====================================================
-- Step 4: Verify the user was created successfully
-- =====================================================
SELECT 
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    u.enabled,
    r.name as role,
    u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'superadmin@mocktest.app'
ORDER BY u.created_at DESC;
