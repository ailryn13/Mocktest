INSERT INTO users (username, email, password, password_hash, first_name, last_name, department, profile, enabled) 
VALUES ('superadmin', 'superadmin@mocktest.app', '$2a$10$U2b6TJtbQDmw0CLB/UoPOeXdrOnc.ISHD/eD5gn9QfB0wfwfQvtFe', '$2a$10$U2b6TJtbQDmw0CLB/UoPOeXdrOnc.ISHD/eD5gn9QfB0wfwfQvtFe', 'Super', 'Admin', 'ALL', 'SUPER_ADMIN', true)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, 
    password_hash = EXCLUDED.password_hash,
    profile = EXCLUDED.profile,
    enabled = EXCLUDED.enabled;
