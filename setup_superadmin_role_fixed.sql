-- Create SUPER_ADMIN role if it doesn't exist
INSERT INTO roles (name, description) 
VALUES ('SUPER_ADMIN', 'Super Admin role - system-wide access to manage colleges and assign admins')
ON CONFLICT (name) DO NOTHING;

-- Assign SUPER_ADMIN role to superadmin user
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'superadmin@mocktest.app' 
AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;
