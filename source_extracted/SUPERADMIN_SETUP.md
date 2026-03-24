# Superadmin Setup Guide

## 🔐 Default Superadmin Credentials

**Email:** `superadmin@mocktest.app`  
**Password:** `SuperAdmin@123456`

> ⚠️ **IMPORTANT:** Change this password immediately in production!

---

## 📋 Quick Setup

The superadmin account is automatically created when you start the application for the first time using database migrations.

### Option 1: Automatic Setup (Recommended)

The application automatically creates the superadmin user via Flyway migration:

```bash
# Start the application
docker-compose up -d

# The migration V5__create_superadmin.sql will run automatically
```

### Option 2: Manual Setup

If you need to manually create the superadmin:

```bash
# Connect to database
docker exec -it mocktest-postgres-1 psql -U postgres -d exam_portal_db

# Run the SQL
\i create_superadmin.sql
```

---

## 🔑 Change Superadmin Password

### Method 1: Using SQL (Recommended for Production)

```sql
-- Generate new password hash
-- Use online BCrypt generator or Java utility

UPDATE users 
SET 
  password = '$2a$10$YOUR_NEW_BCRYPT_HASH_HERE',
  password_hash = '$2a$10$YOUR_NEW_BCRYPT_HASH_HERE'
WHERE email = 'superadmin@mocktest.app';
```

### Method 2: Generate BCrypt Hash (Java)

Run this in your backend project:

```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "YourNewPassword123";
        String hash = encoder.encode(password);
        System.out.println("BCrypt Hash: " + hash);
    }
}
```

### Method 3: Using Online Tool

1. Go to: https://bcrypt-generator.com/
2. Enter your new password
3. Set rounds to `10`
4. Copy the generated hash
5. Update database using the SQL above

---

## 🎯 Superadmin Access

### Login via Web Interface

1. Navigate to: `http://YOUR_IP:3000/login`
2. Enter email: `superadmin@mocktest.app`
3. Enter password: `SuperAdmin@123456`
4. Click "Login"

### Login via API

```bash
curl -X POST http://YOUR_IP:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@mocktest.app",
    "password": "SuperAdmin@123456"
  }'
```

PowerShell:
```powershell
Invoke-RestMethod -Uri "http://YOUR_IP:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"superadmin@mocktest.app","password":"SuperAdmin@123456"}'
```

---

## 👥 Superadmin Capabilities

The SUPER_ADMIN role has access to:

### ✅ Full System Access
- Create and manage colleges
- Create admin accounts for colleges
- View all exams across all colleges
- Manage all users (students, moderators, admins)
- Access system-wide analytics
- Configure global settings

### 🏢 Multi-College Management
- Create new colleges/institutions
- Assign admin users to colleges
- View cross-college reports
- Manage college-level permissions

### 👤 User Management
- Create users with any role
- Reset user passwords
- Enable/disable user accounts
- View user activity logs

### 📊 System Monitoring
- View system health metrics
- Access all exam submissions
- Review violation reports
- Export system-wide data

---

## 🔒 Security Best Practices

### 1. Change Default Password
```sql
-- After first login, update password
UPDATE users 
SET password = 'NEW_BCRYPT_HASH', password_hash = 'NEW_BCRYPT_HASH'
WHERE email = 'superadmin@mocktest.app';
```

### 2. Use Strong Passwords
- Minimum 12 characters
- Include uppercase, lowercase, numbers, special characters
- Don't use common words or patterns

### 3. Limit Superadmin Accounts
- Only create superadmin accounts when necessary
- Use college-specific ADMIN role for college management
- Audit superadmin activity regularly

### 4. Enable 2FA (Future Enhancement)
- Two-factor authentication for superadmin
- IP whitelisting for superadmin access
- Session timeout configuration

---

## 📁 Related Files

### SQL Scripts
- `create_superadmin.sql` - Creates superadmin user
- `setup_superadmin_role.sql` - Assigns SUPER_ADMIN role
- `update_superadmin_password.sql` - Updates password
- `assign_superadmin_role.sql` - Assigns role to existing user

### Database Migrations
- `backend/src/main/resources/db/migration/V5__create_superadmin.sql` - Flyway migration
- `backend/src/main/resources/db/migration/V5__create_multi_college_schema.sql` - Multi-college setup

### Documentation
- `MULTI_COLLEGE_IMPLEMENTATION.md` - Multi-tenancy details
- `MULTI_COLLEGE_QUICKSTART.md` - Quick start guide

---

## 🆘 Troubleshooting

### Problem: Can't login as superadmin

**Solution 1:** Verify user exists
```sql
SELECT * FROM users WHERE email = 'superadmin@mocktest.app';
```

**Solution 2:** Check role assignment
```sql
SELECT u.email, r.name 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'superadmin@mocktest.app';
```

**Solution 3:** Reset password
```sql
UPDATE users 
SET 
  password = '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',
  password_hash = '$2a$10$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm'
WHERE email = 'superadmin@mocktest.app';
-- Password will be: SuperAdmin@123456
```

### Problem: Migration didn't create superadmin

**Solution:** Run migration manually
```bash
docker exec -it mocktest-postgres-1 psql -U postgres -d exam_portal_db -f /path/to/V5__create_superadmin.sql
```

### Problem: Forgot superadmin password

**Solution:** Reset to default
```bash
docker exec mocktest-postgres-1 psql -U postgres -d exam_portal_db -c "
UPDATE users 
SET password = '\$2a\$10\$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm',
    password_hash = '\$2a\$10\$EIxaYMYuVP5qjSnPwHPYnuKBQYPcR42rYV5n0GvXQ9j/sZLxl9Yvm'
WHERE email = 'superadmin@mocktest.app';
"
# Password reset to: SuperAdmin@123456
```

---

## 🚀 GCP Deployment

For GCP Compute Engine VM (IP: 34.180.47.20):

```bash
# SSH into VM
ssh -i mocktest.pem ubuntu@34.180.47.20

# Access database
docker exec -it mocktest-postgres-1 psql -U postgres -d exam_portal_db

# Verify superadmin
SELECT email, first_name, last_name, enabled FROM users WHERE email = 'superadmin@mocktest.app';
```

**Access URLs:**
- Frontend: http://34.180.47.20:3000
- Backend API: http://34.180.47.20:8080
- Login: http://34.180.47.20:3000/login

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/ailryn13/Mocktest/issues
- Check documentation: `MULTI_COLLEGE_IMPLEMENTATION.md`
- Review logs: `docker-compose logs backend`
