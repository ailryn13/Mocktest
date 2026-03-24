-- Data Migration Script: Migrate Existing Data to Multi-College System
-- Description: Migrates existing single-college data to multi-college structure
-- Date: 2026-03-07
-- Prerequisites: Run migration_01_schema_college.sql first

-- =====================================================
-- IMPORTANT: Review and Customize Before Running!
-- =====================================================
-- This script creates a default college and assigns all existing data to it.
-- Modify the college details below to match your institution.

-- =====================================================
-- STEP 1: Create Default College
-- =====================================================
-- Change these values to match your institution:
INSERT INTO colleges (name, code, address, city, state, country, contact_phone, contact_email, active, description)
VALUES (
    'Default College',  -- Change this to your college name
    'DEFAULT',          -- Change this to your college code
    '123 Main Street',  -- Your college address
    'City Name',
    'State',
    'India',
    '+91-1234567890',
    'admin@college.edu',
    true,
    'Default college created during migration'
)
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Store the college ID for reference
DO $$
DECLARE
    default_college_id BIGINT;
BEGIN
    -- Get the default college ID
    SELECT id INTO default_college_id FROM colleges WHERE code = 'DEFAULT' LIMIT 1;
    
    IF default_college_id IS NULL THEN
        RAISE EXCEPTION 'Default college not created. Check INSERT statement above.';
    END IF;

    RAISE NOTICE 'Default College ID: %', default_college_id;

    -- =====================================================
    -- STEP 2: Migrate Users to Default College
    -- =====================================================
    -- Assign all existing users (except future SUPER_ADMIN) to default college
    UPDATE users 
    SET college_id = default_college_id
    WHERE college_id IS NULL
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = users.id AND r.name = 'SUPER_ADMIN'
    );

    RAISE NOTICE 'Migrated % users to default college', (SELECT COUNT(*) FROM users WHERE college_id = default_college_id);

    -- =====================================================
    -- STEP 3: Migrate Tests to Default College
    -- =====================================================
    UPDATE tests 
    SET college_id = default_college_id
    WHERE college_id IS NULL;

    RAISE NOTICE 'Migrated % tests to default college', (SELECT COUNT(*) FROM tests WHERE college_id = default_college_id);

    -- =====================================================
    -- STEP 4: Migrate Questions to Default College
    -- =====================================================
    -- Option 1: Assign all questions to default college
    UPDATE questions 
    SET college_id = default_college_id
    WHERE college_id IS NULL;

    -- Option 2: Keep some questions global (NULL college_id)
    -- Uncomment if you want certain questions available to all colleges:
    -- UPDATE questions 
    -- SET college_id = NULL
    -- WHERE department = 'General' OR department IS NULL;

    RAISE NOTICE 'Migrated % questions to default college', (SELECT COUNT(*) FROM questions WHERE college_id = default_college_id);

    -- =====================================================
    -- STEP 5: Migrate Student Attempts to Default College
    -- =====================================================
    -- Derive college_id from the test
    UPDATE student_attempts sa
    SET college_id = default_college_id
    WHERE college_id IS NULL
    AND EXISTS (
        SELECT 1 FROM tests t 
        WHERE t.id = sa.test_id 
        AND t.college_id = default_college_id
    );

    RAISE NOTICE 'Migrated % student attempts to default college', (SELECT COUNT(*) FROM student_attempts WHERE college_id = default_college_id);

    -- =====================================================
    -- STEP 6: Migrate Proctor Logs to Default College
    -- =====================================================
    UPDATE proctor_logs pl
    SET college_id = default_college_id
    WHERE college_id IS NULL
    AND EXISTS (
        SELECT 1 FROM tests t 
        WHERE t.id = pl.test_id 
        AND t.college_id = default_college_id
    );

    RAISE NOTICE 'Migrated % proctor logs to default college', (SELECT COUNT(*) FROM proctor_logs WHERE college_id = default_college_id);

    -- =====================================================
    -- STEP 7: Migrate Screen Recordings to Default College
    -- =====================================================
    UPDATE screen_recordings sr
    SET college_id = default_college_id
    WHERE college_id IS NULL
    AND EXISTS (
        SELECT 1 FROM student_attempts sa 
        WHERE sa.id = sr.attempt_id 
        AND sa.college_id = default_college_id
    );

    RAISE NOTICE 'Migrated % screen recordings to default college', (SELECT COUNT(*) FROM screen_recordings WHERE college_id = default_college_id);

    -- =====================================================
    -- STEP 8: Migrate Violations to Default College
    -- =====================================================
    UPDATE violation v
    SET college_id = default_college_id
    WHERE college_id IS NULL
    AND EXISTS (
        SELECT 1 FROM tests t 
        WHERE t.id = v.exam_id 
        AND t.college_id = default_college_id
    );

    RAISE NOTICE 'Migrated % violations to default college', (SELECT COUNT(*) FROM violation WHERE college_id = default_college_id);

END $$;

-- =====================================================
-- STEP 9: Create SUPER_ADMIN User (Optional)
-- =====================================================
-- Uncomment and customize to create a SUPER_ADMIN account:

-- INSERT INTO users (username, password, first_name, last_name, email, phone, department, enabled, college_id, created_at)
-- VALUES (
--     'superadmin',
--     '$2a$10$HASHED_PASSWORD_HERE',  -- Use BCrypt hash, generate via BCryptGen.java
--     'Super',
--     'Admin',
--     'superadmin@system.com',
--     NULL,
--     NULL,  -- SUPER_ADMIN doesn't need department
--     true,
--     NULL,  -- SUPER_ADMIN has no college assignment
--     NOW()
-- )
-- ON CONFLICT (username) DO NOTHING
-- RETURNING id;

-- Assign SUPER_ADMIN role:
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT 
--     (SELECT id FROM users WHERE username = 'superadmin'),
--     (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 10: Validation Queries
-- =====================================================
-- Run these queries to verify migration:

-- Check colleges
SELECT 'Colleges' as entity, COUNT(*) as count FROM colleges;

-- Check users per college
SELECT 
    COALESCE(c.name, 'No College (SUPER_ADMIN)') as college,
    COUNT(u.id) as user_count
FROM users u
LEFT JOIN colleges c ON u.college_id = c.id
GROUP BY c.name
ORDER BY user_count DESC;

-- Check tests per college
SELECT 
    c.name as college,
    COUNT(t.id) as test_count
FROM tests t
JOIN colleges c ON t.college_id = c.id
GROUP BY c.name
ORDER BY test_count DESC;

-- Check for unmigrated records (should be 0 or only SUPER_ADMIN users)
SELECT 'Unmigrated Users' as check_name, COUNT(*) as count FROM users WHERE college_id IS NULL;
SELECT 'Unmigrated Tests' as check_name, COUNT(*) as count FROM tests WHERE college_id IS NULL;
SELECT 'Unmigrated Attempts' as check_name, COUNT(*) as count FROM student_attempts WHERE college_id IS NULL;

-- =====================================================
-- STEP 11: Make college_id Required (After Verification)
-- =====================================================
-- After verifying the migration, uncomment to enforce NOT NULL constraints:

-- ALTER TABLE tests 
-- ALTER COLUMN college_id SET NOT NULL;

-- ALTER TABLE student_attempts 
-- ALTER COLUMN college_id SET NOT NULL;

-- ALTER TABLE proctor_logs 
-- ALTER COLUMN college_id SET NOT NULL;

-- ALTER TABLE screen_recordings 
-- ALTER COLUMN college_id SET NOT NULL;

-- ALTER TABLE violation 
-- ALTER COLUMN college_id SET NOT NULL;

-- Note: users.college_id and questions.college_id remain nullable
-- (SUPER_ADMIN has no college, global questions have no college)
