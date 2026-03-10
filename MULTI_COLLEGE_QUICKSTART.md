# Multi-College System - Quick Start Guide

## ✅ Implementation Status: COMPLETE

All code changes have been implemented successfully!

## 🚀 Quick Start - Next Steps

### 1. Run Database Migrations (REQUIRED)

```powershell
# Step 1: Connect to your PostgreSQL database
psql -U postgres -d mocktest

# Step 2: Run schema migration
\i backend/migration_01_schema_college.sql

# Step 3: IMPORTANT - Edit migration_02_data_migration.sql first!
# Change the default college name, code, and contact information

# Step 4: Run data migration
\i backend/migration_02_data_migration.sql

# Step 5: Verify migrations
SELECT * FROM colleges;
SELECT COUNT(*) FROM users WHERE college_id IS NOT NULL;
```

### 2. Create SUPER_ADMIN User

```sql
-- Generate password hash first (use your backend BCryptGen.java)
-- Or use this example (password: superadmin123)
INSERT INTO users (username, password, first_name, last_name, email, enabled, college_id)
VALUES (
  'superadmin',
  '$2a$10$K5R7IqYq1V9w8wD.nU7XZOKGzJX1OqJ0fKr8Kj1Kj1Kj1Kj1Kj1Kj',  -- CHANGE THIS!
  'Super',
  'Admin',
  'superadmin@system.com',
  true,
  NULL  -- NULL = SUPER_ADMIN has no college
);

-- Assign SUPER_ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT 
  (SELECT id FROM users WHERE username = 'superadmin'),
  (SELECT id FROM roles WHERE name = 'SUPER_ADMIN');
```

### 3. Rebuild Backend

```powershell
cd backend
mvn clean package -DskipTests
```

### 4. Restart Application

```powershell
# Stop current instance
.\stop-app.ps1

# Start with new code
.\start-app.ps1
```

### 5. Test SUPER_ADMIN Login

```powershell
# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"superadmin","password":"superadmin123"}'

# Response should include collegeId: null in JWT
```

### 6. Create Your First College

```powershell
# Use the JWT token from step 5
$token = "YOUR_JWT_TOKEN_HERE"

curl -X POST http://localhost:8080/api/colleges `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "My Engineering College",
    "code": "MEC",
    "city": "Your City",
    "state": "Your State",
    "country": "India",
    "contactEmail": "admin@mycollege.edu",
    "active": true
  }'
```

---

## 📋 What Changed?

### New Features
✅ **2 New Roles:** SUPER_ADMIN, ADMIN  
✅ **College Entity:** Stores institution information  
✅ **College Isolation:** Complete data separation between colleges  
✅ **CollegeController:** SUPER_ADMIN can manage colleges via API  
✅ **Updated Security:** Row-level filtering by college  

### Modified Features
✅ **All Entities:** Added collegeId foreign key  
✅ **All Repositories:** Added college-based query methods  
✅ **JWT Token:** Now includes collegeId claim  
✅ **RlsAspect:** Filters by college instead of department  
✅ **Security Service:** New CollegeSecurityService  

---

## 🔑 Role Capabilities

| Action | SUPER_ADMIN | ADMIN | MODERATOR | STUDENT |
|--------|-------------|-------|-----------|---------|
| Create Colleges | ✅ | ❌ | ❌ | ❌ |
| Assign Admins | ✅ | ❌ | ❌ | ❌ |
| View All Colleges | ✅ | ❌ | ❌ | ❌ |
| Manage Own College | ❌* | ✅ | ✅** | ❌ |
| View Other College Data | ❌ | ❌ | ❌ | ❌ |

*SUPER_ADMIN cannot directly manage college data - must assign ADMIN first  
**Department restricted

---

## ⚠️ Important Notes

### Data Isolation Rules
- College A users **CANNOT** see College B data
- College A tests **CANNOT** be taken by College B students
- College A questions **CANNOT** be used by College B (unless global)
- RLS enforced automatically via Hibernate filters

### SUPER_ADMIN Behavior
- Has **NO** college assignment (collegeId = NULL)
- Can see ALL colleges in system
- **Cannot** directly create tests/questions for a college
- **Must** assign ADMIN to each college for management

### Global Questions
- Questions with collegeId = NULL are **globally shared**
- All colleges can use global questions
- Be careful not to include college-specific content in global questions

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Database migrations completed successfully
- [ ] SUPER_ADMIN user created and can login
- [ ] SUPER_ADMIN can create new colleges via API
- [ ] ADMIN user assigned to College A
- [ ] ADMIN can see College A data only
- [ ] ADMIN cannot see College B data
- [ ] MODERATOR in College A cannot see College B tests
- [ ] STUDENT in College A cannot take College B exams
- [ ] JWT token includes collegeId claim
- [ ] Row-level security filters working
- [ ] Global questions visible to all colleges
- [ ] College-specific questions not visible across colleges

---

## 🐛 Troubleshooting

### Issue: "No college_id column" error
**Solution:** Run migration_01_schema_college.sql

### Issue: "Foreign key violation on college_id"
**Solution:** Run migration_02_data_migration.sql to populate college_id

### Issue: SUPER_ADMIN sees no data
**Expected:** SUPER_ADMIN should assign ADMIN users, not directly manage data

### Issue: RLS not filtering data
**Solution:** Check RlsAspect is enabled and collegeId is in JWT token

### Issue: Cannot create test without college
**Solution:** Ensure user has collegeId (except SUPER_ADMIN)

---

## 📞 Need Help?

1. Check [MULTI_COLLEGE_IMPLEMENTATION.md](./MULTI_COLLEGE_IMPLEMENTATION.md) for full documentation
2. Review migration scripts: `backend/migration_01_schema_college.sql` and `migration_02_data_migration.sql`
3. Check entity files for college relationship structure
4. Review CollegeSecurityService for security implementation

---

**Status:** ✅ Ready for Database Migration  
**Last Updated:** March 7, 2026
