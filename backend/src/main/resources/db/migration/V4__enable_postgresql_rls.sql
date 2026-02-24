-- ==========================================
-- 🛡️ POSTGRESQL NATIVE ROW-LEVEL SECURITY
-- ==========================================

-- 1. Enable RLS on the 'tests' table
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow access if the department matches the session variable
-- or if the department is 'General'.
CREATE POLICY dept_isolation_policy ON tests
    USING (
        department = current_setting('app.current_department', true)
        OR department = 'General'
    );

-- 2. Enable RLS on the 'questions' table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow access if the department matches the session variable,
-- or if the department is 'General' or NULL (public questions).
CREATE POLICY question_isolation_policy ON questions
    USING (
        department = current_setting('app.current_department', true)
        OR department = 'General'
        OR department IS NULL
    );

-- ==========================================
-- 💡 NOTE: The 'current_setting(..., true)' second parameter
-- ensures that if the variable is NOT set (e.g. direct admin login),
-- it returns NULL rather than throwing an error.
-- ==========================================
