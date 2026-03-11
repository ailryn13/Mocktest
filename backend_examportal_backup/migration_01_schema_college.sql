-- Migration Script: Multi-College System
-- Description: Adds college-level isolation with SUPER_ADMIN and ADMIN roles
-- Date: 2026-03-07
-- WARNING: This is a BREAKING CHANGE - requires data migration

-- =====================================================
-- STEP 1: Create Colleges Table
-- =====================================================
CREATE TABLE IF NOT EXISTS colleges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(20),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    description VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_college_code ON colleges(code);
CREATE INDEX idx_college_active ON colleges(active);

COMMENT ON TABLE colleges IS 'Educational institutions using the exam portal';
COMMENT ON COLUMN colleges.code IS 'Short unique identifier for college';
COMMENT ON COLUMN colleges.active IS 'Soft delete flag - deactivated colleges are hidden';

-- =====================================================
-- STEP 2: Add New Roles (ADMIN and SUPER_ADMIN)
-- =====================================================
INSERT INTO roles (name, description) VALUES 
    ('ADMIN', 'College Admin - full access to one specific college'),
    ('SUPER_ADMIN', 'System Administrator - can manage colleges and assign admins')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 3: Add college_id Column to All Relevant Tables
-- =====================================================

-- Users table: Add college_id (nullable for SUPER_ADMIN)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- Tests table: Add college_id (required)
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- Questions table: Add college_id (nullable for global questions)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- Student Attempts table: Add college_id
ALTER TABLE student_attempts 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- Proctor Logs table: Add college_id
ALTER TABLE proctor_logs 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- Screen Recordings table: Add college_id
ALTER TABLE screen_recordings 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- Violations table: Add college_id
ALTER TABLE violation 
ADD COLUMN IF NOT EXISTS college_id BIGINT;

-- =====================================================
-- STEP 4: Create Foreign Key Constraints
-- =====================================================

-- Users -> Colleges (nullable for SUPER_ADMIN)
ALTER TABLE users
ADD CONSTRAINT fk_users_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- Tests -> Colleges (required)
ALTER TABLE tests
ADD CONSTRAINT fk_tests_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- Questions -> Colleges (nullable for shared questions)
ALTER TABLE questions
ADD CONSTRAINT fk_questions_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- Student Attempts -> Colleges
ALTER TABLE student_attempts
ADD CONSTRAINT fk_student_attempts_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- Proctor Logs -> Colleges
ALTER TABLE proctor_logs
ADD CONSTRAINT fk_proctor_logs_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- Screen Recordings -> Colleges
ALTER TABLE screen_recordings
ADD CONSTRAINT fk_screen_recordings_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- Violations -> Colleges
ALTER TABLE violation
ADD CONSTRAINT fk_violation_college
FOREIGN KEY (college_id) REFERENCES colleges(id)
ON DELETE RESTRICT;

-- =====================================================
-- STEP 5: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_tests_college_id ON tests(college_id);
CREATE INDEX IF NOT EXISTS idx_questions_college_id ON questions(college_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_college_id ON student_attempts(college_id);
CREATE INDEX IF NOT EXISTS idx_proctor_logs_college_id ON proctor_logs(college_id);
CREATE INDEX IF NOT EXISTS idx_screen_recordings_college_id ON screen_recordings(college_id);
CREATE INDEX IF NOT EXISTS idx_violation_college_id ON violation(college_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_college_department ON users(college_id, department);
CREATE INDEX IF NOT EXISTS idx_tests_college_department ON tests(college_id, department);

-- =====================================================
-- STEP 6: Update Comments
-- =====================================================

COMMENT ON COLUMN users.college_id IS 'College assignment (NULL for SUPER_ADMIN, required for others)';
COMMENT ON COLUMN users.department IS 'Department within college (e.g., CSE, ECE, MECH)';

COMMENT ON COLUMN tests.college_id IS 'College that owns this test';
COMMENT ON COLUMN tests.department IS 'Department filter (General for all departments in college)';

COMMENT ON COLUMN questions.college_id IS 'College that owns this question (NULL for globally shared questions)';

COMMENT ON COLUMN student_attempts.college_id IS 'College context for this attempt';
COMMENT ON COLUMN proctor_logs.college_id IS 'College context for this log';
COMMENT ON COLUMN screen_recordings.college_id IS 'College context for this recording';
COMMENT ON COLUMN violation.college_id IS 'College context for this violation';

-- =====================================================
-- STEP 7: PostgreSQL Row-Level Security (Optional)
-- =====================================================
-- Enable RLS for college-based access control
-- Uncomment if you want database-level enforcement in addition to application-level

-- ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY college_isolation_policy ON tests
--     USING (college_id = current_setting('app.current_college_id', true)::BIGINT);

-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY college_isolation_policy ON questions
--     USING (college_id = current_setting('app.current_college_id', true)::BIGINT OR college_id IS NULL);

-- =====================================================
-- NOTES FOR DATA MIGRATION
-- =====================================================
-- After running this schema migration, you MUST run the data migration script:
-- 1. Create at least one default college
-- 2. Assign all existing users to that college
-- 3. Assign all existing tests, questions to that college
-- 4. Update all related records (attempts, logs, etc.)
-- See: migration_02_data_migration.sql
