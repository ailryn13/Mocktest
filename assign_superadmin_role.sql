-- Create SUPER_ADMIN role if it doesn't exist
INSERT INTO roles (name, description) 
VALUES ('SUPER_ADMIN', 'Super Admin - system-wide access, can manage colleges and assign admins')
ON CONFLICT (name) DO NOTHING;

-- Get the role ID and user ID, then create the user_roles relationship
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'superadmin@mocktest.app' 
  AND r.name = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
