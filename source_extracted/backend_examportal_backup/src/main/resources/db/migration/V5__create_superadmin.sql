-- Migration: Create SUPER_ADMIN User (Compatible with Existing Schema)
-- File: V5__create_superadmin.sql
-- Description: Creates SUPER_ADMIN user in the existing schema

-- =====================================================
-- 1. Drop the existing CHECK constraint to allow SUPER_ADMIN role
-- =====================================================
DO $$ 
BEGIN
    -- Drop the CHECK constraint for role values
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    RAISE NOTICE 'Dropped users_role_check constraint to allow SUPER_ADMIN role';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint did not exist or could not be dropped';
END $$;

-- =====================================================
-- 2. Re-add CHECK constraint with new roles
-- =====================================================
DO $$ 
BEGIN
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role::text = ANY (ARRAY['ADMIN'::character varying, 'MODERATOR'::character varying, 'STUDENT'::character varying, 'SUPER_ADMIN'::character varying]::text[]));
    RAISE NOTICE 'Added updated users_role_check constraint with SUPER_ADMIN role';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint already exists or could not be added: %', SQLERRM;
END $$;

-- =====================================================
-- 3. Insert SUPER_ADMIN user
-- =====================================================
-- Insert SUPER_ADMIN user with no college assignment (system-wide access)
-- Password: SuperAdmin@123456 (BCrypt)
INSERT INTO users (
    email, 
    name, 
    password_hash, 
    role,
    department_id,
    college_id
) VALUES (
    'superadmin@mocktest.app',
    'Super Admin',
    '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',  -- BCrypt: SuperAdmin@123456
    'SUPER_ADMIN',
    NULL,  -- No department
    NULL   -- No college (system-wide access)
) ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',
    role = 'SUPER_ADMIN'
RETURNING id, email, role;

-- =====================================================
-- 4. Assign SUPER_ADMIN role in user_roles table (if exists)
-- =====================================================
DO $$ 
DECLARE
    user_id bigint;
    roles_exist boolean;
BEGIN
    -- Check if roles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'roles' AND table_schema = 'public'
    ) INTO roles_exist;
    
    IF roles_exist THEN
        -- Get the SUPER_ADMIN user ID
        SELECT id INTO user_id FROM users WHERE email = 'superadmin@mocktest.app';
        
        -- Get or create SUPER_ADMIN role
        INSERT INTO roles (name, description) 
        VALUES ('SUPER_ADMIN', 'System-wide administrator with access to all colleges')
        ON CONFLICT (name) DO NOTHING;
        
        -- Assign role to user
        INSERT INTO user_roles (user_id, role_id)
        SELECT user_id, id FROM roles WHERE name = 'SUPER_ADMIN'
        ON CONFLICT (user_id, role_id) DO NOTHING;
        
        RAISE NOTICE 'SUPER_ADMIN role assigned to user_id: %', user_id;
    END IF;
END $$;

-- =====================================================
-- 5. Verification
-- =====================================================
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    CASE WHEN u.college_id IS NULL THEN 'System-wide Access' ELSE 'College ' || u.college_id END as access_level
FROM users u
WHERE u.email = 'superadmin@mocktest.app';
