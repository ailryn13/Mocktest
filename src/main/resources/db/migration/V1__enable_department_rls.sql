-- ==========================================
-- 🛡️ POSTGRESQL ROW-LEVEL SECURITY (RLS)
-- Department-based isolation with SUPER_ADMIN bypass
-- ==========================================
-- 
-- HOW THE SUPER_ADMIN BYPASS WORKS:
-- 
--   Each policy has TWO OR-ed conditions:
--
--   1. current_setting('app.current_role', true) = 'SUPER_ADMIN'
--      → The RlsAspect sets this session variable to 'SUPER_ADMIN' when
--        a SUPER_ADMIN user is authenticated. This evaluates to TRUE,
--        making ALL rows visible regardless of department.
--
--   2. <department match condition>
--      → For normal users, the RlsAspect sets 'app.current_department_id'
--        to the user's department ID. Only rows matching that department
--        are visible.
--
--   The second parameter 'true' in current_setting(..., true) means:
--   "return NULL instead of throwing an error if the variable is NOT set".
--   This safely handles direct DB connections or unauthenticated contexts.
-- ==========================================


-- =====================================================
-- 1. USERS TABLE — direct department_id column
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY dept_isolation_users ON users
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'SUPER_ADMIN'
        OR department_id::text = current_setting('app.current_department_id', true)
    );


-- =====================================================
-- 2. EXAMS TABLE — department resolved via mediator FK
-- =====================================================
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY dept_isolation_exams ON exams
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'SUPER_ADMIN'
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = exams.mediator_id
              AND u.department_id::text = current_setting('app.current_department_id', true)
        )
    );


-- =====================================================
-- 3. QUESTIONS TABLE — department resolved via exam → mediator
-- =====================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY dept_isolation_questions ON questions
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'SUPER_ADMIN'
        OR EXISTS (
            SELECT 1 FROM exams e
            JOIN users u ON u.id = e.mediator_id
            WHERE e.id = questions.exam_id
              AND u.department_id::text = current_setting('app.current_department_id', true)
        )
    );


-- =====================================================
-- 4. SUBMISSIONS TABLE — department resolved via user FK
-- =====================================================
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY dept_isolation_submissions ON submissions
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'SUPER_ADMIN'
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = submissions.user_id
              AND u.department_id::text = current_setting('app.current_department_id', true)
        )
    );


-- =====================================================
-- 5. MALPRACTICE_LOGS TABLE — department resolved via user FK
-- =====================================================
ALTER TABLE malpractice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY dept_isolation_malpractice ON malpractice_logs
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'SUPER_ADMIN'
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = malpractice_logs.user_id
              AND u.department_id::text = current_setting('app.current_department_id', true)
        )
    );


-- =====================================================
-- 6. DEPARTMENTS TABLE — accessible to all (reference data)
-- =====================================================
-- No RLS on departments — it is shared reference data.
-- All roles can see all departments.


-- =====================================================
-- 7. PASSWORD_RESET_TOKENS TABLE — department resolved via user FK
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'password_reset_tokens' AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY';
        EXECUTE '
            CREATE POLICY dept_isolation_tokens ON password_reset_tokens
                FOR ALL
                USING (
                    current_setting(''app.current_role'', true) = ''SUPER_ADMIN''
                    OR EXISTS (
                        SELECT 1 FROM users u
                        WHERE u.id = password_reset_tokens.user_id
                          AND u.department_id::text = current_setting(''app.current_department_id'', true)
                    )
                )
        ';
    END IF;
END $$;


-- =====================================================
-- 8. Ensure the database OWNER role is exempt from RLS
-- =====================================================
-- By default, table owners BYPASS RLS policies.
-- This means Hibernate/JDBC connections using the table owner
-- role will NOT be restricted. If you need the app user to
-- respect RLS, ensure the app connects as a non-owner role,
-- or use: ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
--
-- For now, we rely on the Hibernate Filter (application-level)
-- as the primary enforcement, with PostgreSQL RLS as a
-- defense-in-depth layer.
