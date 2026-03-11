-- Migration: Create Multi-College System Schema and SUPER_ADMIN User
-- File: V5__create_multi_college_schema.sql
-- Description: Creates roles, colleges, and multi-college isolation system

-- =====================================================
-- 1. Create ROLES table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard roles
INSERT INTO roles (name, description) VALUES 
    ('STUDENT', 'Student user - can take exams'),
    ('MODERATOR', 'Moderator - can create tests and questions for department'),
    ('ADMIN', 'College Admin - full access to college data'),
    ('SUPER_ADMIN', 'System Admin - access to all colleges')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. Create COLLEGES table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50),
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. Add college_id to existing USERS table
-- =====================================================
-- Check if college_id column already exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='college_id') THEN
        ALTER TABLE users ADD COLUMN college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);
    END IF;
END $$;

-- =====================================================
-- 4. Create USER_ROLES junction table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- =====================================================
-- 5. Migrate existing users to STUDENT role
-- =====================================================
-- Insert existing users into user_roles if they don't have one
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
CROSS JOIN roles r
WHERE ur.id IS NULL AND r.name = 'STUDENT'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. Create SUPER_ADMIN user
-- =====================================================
INSERT INTO users (
    email, 
    first_name, 
    last_name, 
    password, 
    department,
    college_id,
    enabled,
    created_at,
    updated_at
) VALUES (
    'superadmin@mocktest.app',
    'Super',
    'Admin',
    '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',  -- BCrypt: SuperAdmin@123456
    'System',
    NULL,  -- SUPER_ADMIN has no college assignment
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE 
SET password = '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',
    enabled = true,
    updated_at = NOW()
RETURNING id;

-- =====================================================
-- 7. Assign SUPER_ADMIN role to the user
-- =====================================================
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'superadmin@mocktest.app' 
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =====================================================
-- 8. Verification - Display SUPER_ADMIN user
-- =====================================================
SELECT 
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    u.enabled,
    r.name as role,
    CASE WHEN u.college_id IS NULL THEN 'System-wide' ELSE 'College ' || u.college_id END as access_level,
    u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'superadmin@mocktest.app'
ORDER BY u.created_at DESC;
