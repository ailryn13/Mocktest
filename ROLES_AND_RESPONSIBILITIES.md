# Roles and Responsibilities Guide

Complete reference for all user roles, their capabilities, and access permissions in the Mocktest Exam Portal system.

---

## 📊 Role Hierarchy

```
SUPER_ADMIN (System Administrator)
    ↓
ADMIN (College Administrator)
    ↓
MODERATOR (Exam Creator/Proctor)
    ↓
STUDENT (Exam Taker)
```

---

## 🎭 Role Definitions

### 1. 👑 SUPER_ADMIN (System Administrator)

**Access Level:** System-wide across all colleges  
**College Assignment:** None (collegeId = NULL)  
**Authority:** Highest level - manages the entire platform

#### ✅ Capabilities

##### College Management
- ✅ Create new colleges/institutions
- ✅ Edit college information (name, code, location)
- ✅ Activate/deactivate colleges
- ✅ Delete colleges (with cascade handling)
- ✅ View all colleges in the system
- ✅ View college statistics and user counts

##### User Management
- ✅ Create ADMIN users and assign to colleges
- ✅ View all users across all colleges
- ✅ Filter users by role and college
- ✅ Enable/disable user accounts system-wide
- ✅ Reset passwords for any user
- ✅ Remove users from colleges
- ✅ View user activity logs

##### System Administration
- ✅ Access system-wide analytics and reports
- ✅ View cross-college exam statistics
- ✅ Monitor platform health and performance
- ✅ Configure global application settings
- ✅ Export system-wide data
- ✅ Review violation reports across all colleges
- ✅ Manage database migrations

##### Multi-College Operations
- ✅ Assign ADMIN users to multiple colleges
- ✅ Transfer users between colleges
- ✅ View cross-college comparison reports
- ✅ Manage college-level permissions

#### ❌ Restrictions
- ❌ Cannot directly manage exams (must assign ADMIN)
- ❌ Cannot create questions (must assign MODERATOR)
- ❌ Cannot take exams as a student
- ❌ Cannot access college-specific operations without assigning role

#### 🔐 Security
- Must change default password immediately
- Should enable 2FA (when available)
- IP whitelisting recommended
- Limited to essential personnel only

#### 📌 Default Credentials
- **Email:** `superadmin@mocktest.app`
- **Password:** `SuperAdmin@123456` (CHANGE IMMEDIATELY)

#### 🛠️ API Endpoints
```
POST   /api/colleges                    - Create college
GET    /api/colleges                    - List all colleges
GET    /api/colleges/{id}               - Get college details
PUT    /api/colleges/{id}               - Update college
DELETE /api/colleges/{id}               - Delete college
GET    /api/colleges/{id}/users/count   - Get user counts

POST   /api/admin/users/admin           - Create ADMIN user
GET    /api/admin/users/college/{id}    - Get users by college
GET    /api/admin/users/role/{role}     - Get users by role
DELETE /api/admin/users/{id}            - Delete user
```

---

### 2. 🏢 ADMIN (College Administrator)

**Access Level:** Full access to ONE specific college  
**College Assignment:** Required (must be assigned to a college)  
**Authority:** Manages all aspects of their assigned college

#### ✅ Capabilities

##### User Management (College-Specific)
- ✅ Create MODERATOR accounts for their college
- ✅ Create STUDENT accounts for their college
- ✅ View all users in their college
- ✅ Reset passwords for college users
- ✅ Enable/disable user accounts in their college
- ✅ Assign students to departments
- ✅ Manage user profiles and information

##### Department Management
- ✅ Create and manage departments
- ✅ Assign moderators to departments
- ✅ View department-wise statistics
- ✅ Configure department settings

##### Exam Management
- ✅ View all exams in their college
- ✅ Monitor ongoing exams
- ✅ Review exam results and analytics
- ✅ Export exam reports
- ✅ Manage exam schedules
- ✅ View exam submissions across all departments

##### Student Monitoring
- ✅ View all student attempts
- ✅ Monitor exam violations
- ✅ Review proctoring logs
- ✅ Access student performance analytics
- ✅ View screen recordings and activity logs
- ✅ Generate student reports

##### Analytics & Reporting
- ✅ View college-wide analytics
- ✅ Generate performance reports
- ✅ Access dashboard with college metrics
- ✅ Export data for their college
- ✅ View department-wise comparisons

#### ❌ Restrictions
- ❌ Cannot access data from other colleges
- ❌ Cannot create or modify colleges
- ❌ Cannot assign ADMIN role to users
- ❌ Cannot view system-wide analytics
- ❌ Cannot directly create exams (must delegate to MODERATOR)

#### 🔐 Access Control
- **Row-Level Security:** Automatically filtered to their college
- **API Security:** `@PreAuthorize("hasAuthority('ADMIN')")`
- **Database Filter:** All queries filtered by `college_id`

#### 🛠️ API Endpoints
```
POST   /api/admin/moderators            - Create moderator
POST   /api/admin/students              - Create student
GET    /api/admin/users                 - List college users
PUT    /api/admin/users/{id}            - Update user
DELETE /api/admin/users/{id}            - Remove user

GET    /api/admin/departments           - List departments
POST   /api/admin/departments           - Create department
PUT    /api/admin/departments/{id}      - Update department

GET    /api/admin/exams                 - View all exams
GET    /api/admin/analytics             - College analytics
GET    /api/admin/violations            - View violations
```

---

### 3. 📝 MODERATOR (Exam Creator/Proctor)

**Access Level:** Department-restricted within their college  
**College Assignment:** Required  
**Department Assignment:** Required  
**Authority:** Creates and manages exams for their department

#### ✅ Capabilities

##### Exam Creation & Management
- ✅ Create new exams/tests
- ✅ Configure exam settings (duration, attempts, scheduling)
- ✅ Set exam windows (start/end dates)
- ✅ Enable/disable exams
- ✅ Freeze/unfreeze exam configurations
- ✅ Clone existing exams
- ✅ Delete exams (if no attempts)

##### Question Management
- ✅ Create MCQ questions
- ✅ Create coding questions with test cases
- ✅ Set question difficulty and marks
- ✅ Add constraints for coding problems
- ✅ Configure code execution limits
- ✅ Create question banks
- ✅ Import/export questions
- ✅ Tag questions by topic

##### Student Monitoring
- ✅ View students taking their exams
- ✅ Monitor real-time exam progress
- ✅ Review exam violations
- ✅ Access proctoring logs
- ✅ View screen recordings
- ✅ Verify coding solutions manually
- ✅ Add remarks to student attempts

##### Grading & Evaluation
- ✅ Auto-grade MCQ questions
- ✅ Auto-grade coding questions (Judge0)
- ✅ Manually verify borderline solutions
- ✅ Override automatic grades (with justification)
- ✅ View detailed submission reports
- ✅ Export exam results

##### Queue Management
- ✅ Manage verification queue for coding solutions
- ✅ Approve/reject manual verification requests
- ✅ View pending evaluations
- ✅ Priority queue management

#### ❌ Restrictions
- ❌ Cannot view exams from other departments (unless granted)
- ❌ Cannot access other colleges' data
- ❌ Cannot create users (students, moderators, admins)
- ❌ Cannot modify college or department settings
- ❌ Cannot access system-wide analytics
- ❌ Cannot view exams created by other moderators (unless shared)

#### 🔐 Access Control
- **Row-Level Security:** Filtered by college AND department
- **API Security:** `@PreAuthorize("hasAuthority('MODERATOR')")`
- **Department Filter:** `department = user.department`

#### 🛠️ API Endpoints
```
POST   /api/moderator/tests             - Create exam
PUT    /api/moderator/tests/{id}        - Update exam
DELETE /api/moderator/tests/{id}        - Delete exam
GET    /api/moderator/tests             - List my exams
POST   /api/moderator/tests/{id}/freeze - Freeze exam

POST   /api/moderator/questions         - Create question
PUT    /api/moderator/questions/{id}    - Update question
DELETE /api/moderator/questions/{id}    - Delete question
GET    /api/moderator/questions         - List my questions

GET    /api/moderator/queue             - Verification queue
POST   /api/moderator/verify-solution   - Verify coding solution
GET    /api/moderator/analytics         - Exam analytics
GET    /api/moderator/violations/{examId} - View violations
```

---

### 4. 🎓 STUDENT (Exam Taker)

**Access Level:** Personal data only (own submissions)  
**College Assignment:** Required  
**Department Assignment:** Required  
**Authority:** Takes exams and views own results

#### ✅ Capabilities

##### Exam Taking
- ✅ View available exams for their department
- ✅ Start exam attempts
- ✅ Submit MCQ answers
- ✅ Write and submit code solutions
- ✅ Run code against sample test cases
- ✅ Request manual verification for coding problems
- ✅ Track remaining time
- ✅ Resume paused exams (if allowed)
- ✅ View exam instructions

##### Submission Management
- ✅ View own exam history
- ✅ View detailed results for completed exams
- ✅ View question-wise breakdown
- ✅ View auto-graded scores
- ✅ Check verification status for coding questions
- ✅ View remarks from moderators
- ✅ Download result PDFs (if enabled)

##### Profile & Settings
- ✅ Update personal information
- ✅ Change password
- ✅ View exam calendar
- ✅ View upcoming exams
- ✅ View past performance

##### Proctoring Compliance
- ✅ Grant camera/screen permissions
- ✅ Complete identity verification
- ✅ Acknowledge exam rules
- ✅ View violation warnings (if any)

#### ❌ Restrictions
- ❌ Cannot view other students' submissions
- ❌ Cannot access exam questions before starting
- ❌ Cannot view correct answers (until exam review is enabled)
- ❌ Cannot modify exam settings
- ❌ Cannot create exams or questions
- ❌ Cannot access admin or moderator features
- ❌ Cannot bypass proctoring requirements
- ❌ Cannot view test cases after submission

#### 🔐 Access Control
- **Row-Level Security:** Can only access own `student_attempts`
- **API Security:** `@PreAuthorize("hasAuthority('STUDENT')")`
- **Isolation:** `user_id = current_user.id`

#### 🛠️ API Endpoints
```
GET    /api/student/tests               - View available exams
GET    /api/student/tests/{id}          - Get exam details
POST   /api/student/tests/{id}/start    - Start exam attempt
POST   /api/student/tests/{id}/submit   - Submit exam

POST   /api/student/questions/{id}/answer - Submit MCQ answer
POST   /api/student/questions/{id}/code   - Submit code
POST   /api/student/questions/{id}/run    - Run code (test)
POST   /api/student/questions/{id}/verify - Request verification

GET    /api/student/history             - View exam history
GET    /api/student/results/{attemptId} - View detailed results
GET    /api/student/profile             - View profile
PUT    /api/student/profile             - Update profile
```

---

## 🔒 Security & Access Control

### Role-Based Access Control (RBAC)

#### Spring Security Configuration

```java
// Super Admin endpoints
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public ResponseEntity<?> createCollege() { ... }

// Admin endpoints
@PreAuthorize("hasAuthority('ADMIN')")
public ResponseEntity<?> createModerator() { ... }

// Moderator endpoints
@PreAuthorize("hasAuthority('MODERATOR')")
public ResponseEntity<?> createExam() { ... }

// Student endpoints
@PreAuthorize("hasAuthority('STUDENT')")
public ResponseEntity<?> submitAnswer() { ... }

// Multiple roles
@PreAuthorize("hasAnyAuthority('ADMIN', 'MODERATOR')")
public ResponseEntity<?> viewExamResults() { ... }
```

### Row-Level Security (RLS)

#### Database-Level Filtering

All data queries are automatically filtered based on the user's college:

```java
// SUPER_ADMIN: No filter (sees all colleges)
if (user.isSuperAdmin()) {
    return repository.findAll();
}

// ADMIN, MODERATOR, STUDENT: College filter applied
Long collegeId = user.getCollegeId();
return repository.findByCollegeId(collegeId);
```

#### PostgreSQL RLS (Optional Enhancement)

```sql
-- Enable RLS on tables
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for SUPER_ADMIN (bypass RLS)
CREATE POLICY super_admin_all ON tests
    FOR ALL 
    USING (current_setting('app.role')::text = 'SUPER_ADMIN');

-- Policy for college-restricted users
CREATE POLICY college_isolation ON tests
    FOR ALL
    USING (college_id = current_setting('app.college_id')::bigint);
```

---

## 📋 Permission Matrix

| Feature/Action | SUPER_ADMIN | ADMIN | MODERATOR | STUDENT |
|----------------|-------------|-------|-----------|---------|
| **College Management** |
| Create College | ✅ | ❌ | ❌ | ❌ |
| Edit College | ✅ | ❌ | ❌ | ❌ |
| Delete College | ✅ | ❌ | ❌ | ❌ |
| View All Colleges | ✅ | ❌ | ❌ | ❌ |
| View Own College | N/A | ✅ | ✅ | ✅ |
| **User Management** |
| Create ADMIN | ✅ | ❌ | ❌ | ❌ |
| Create MODERATOR | ✅ | ✅ | ❌ | ❌ |
| Create STUDENT | ✅ | ✅ | ❌ | ❌ |
| Edit Users (Own College) | ✅ | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ❌ | ❌ |
| Reset Passwords | ✅ | ✅ | ❌ | ❌ |
| View All Users (System) | ✅ | ❌ | ❌ | ❌ |
| View College Users | ✅ | ✅ | ✅* | ❌ |
| **Department Management** |
| Create Department | ✅ | ✅ | ❌ | ❌ |
| Edit Department | ✅ | ✅ | ❌ | ❌ |
| Delete Department | ✅ | ✅ | ❌ | ❌ |
| View Departments | ✅ | ✅ | ✅ | ✅ |
| **Exam Management** |
| Create Exam | ❌ | ❌ | ✅ | ❌ |
| Edit Exam | ❌ | ❌ | ✅ | ❌ |
| Delete Exam | ❌ | ❌ | ✅ | ❌ |
| Freeze/Unfreeze Exam | ❌ | ✅ | ✅ | ❌ |
| View All Exams (College) | ✅ | ✅ | ❌ | ❌ |
| View Department Exams | ❌ | ✅ | ✅ | ❌ |
| View Available Exams | ❌ | ❌ | ❌ | ✅ |
| **Question Management** |
| Create Question | ❌ | ❌ | ✅ | ❌ |
| Edit Question | ❌ | ❌ | ✅ | ❌ |
| Delete Question | ❌ | ❌ | ✅ | ❌ |
| View Questions | ❌ | ✅ | ✅ | ❌** |
| **Exam Taking** |
| Take Exam | ❌ | ❌ | ❌ | ✅ |
| Submit Answers | ❌ | ❌ | ❌ | ✅ |
| Run Code Tests | ❌ | ❌ | ❌ | ✅ |
| Request Verification | ❌ | ❌ | ❌ | ✅ |
| **Monitoring & Proctoring** |
| View Live Exams | ✅ | ✅ | ✅ | ❌ |
| View Violations | ✅ | ✅ | ✅ | ❌ |
| Review Recordings | ✅ | ✅ | ✅ | ❌ |
| Terminate Exam | ❌ | ✅ | ✅ | ❌ |
| **Results & Analytics** |
| View System Analytics | ✅ | ❌ | ❌ | ❌ |
| View College Analytics | ✅ | ✅ | ❌ | ❌ |
| View Exam Analytics | ✅ | ✅ | ✅ | ❌ |
| View Own Results | ❌ | ❌ | ❌ | ✅ |
| View All Student Results | ✅ | ✅ | ✅ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ❌ |
| **Grading** |
| Auto-Grade MCQ | ✅ | ✅ | ✅ | ❌ |
| Auto-Grade Code | ✅ | ✅ | ✅ | ❌ |
| Manual Verification | ❌ | ❌ | ✅ | ❌ |
| Override Grades | ❌ | ✅ | ✅ | ❌ |

\* MODERATOR can only view students in exams they created  
\*\* STUDENT can only view questions during active exam attempt

---

## 🔑 Role Assignment Process

### Creating SUPER_ADMIN
```sql
-- Automatically created via database migration V5__create_superadmin.sql
-- Default credentials: superadmin@mocktest.app / SuperAdmin@123456
```

### Creating ADMIN (by SUPER_ADMIN)
```bash
POST /api/admin/users/admin
{
  "username": "admin_college1",
  "email": "admin@college1.edu",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "collegeId": 1,
  "department": "Computer Science",
  "phone": "+1234567890"
}
```

### Creating MODERATOR (by ADMIN)
```bash
POST /api/admin/moderators
{
  "username": "moderator_cs",
  "email": "mod@college1.edu",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Computer Science",
  "phone": "+1234567890"
}
```

### Creating STUDENT (by ADMIN or MODERATOR)
```bash
POST /api/admin/students
{
  "username": "student123",
  "email": "student@college1.edu",
  "password": "TempPass123",
  "firstName": "Alice",
  "lastName": "Johnson",
  "department": "Computer Science",
  "rollNumber": "CS-2024-001",
  "phone": "+1234567890"
}
```

---

## 🛡️ Security Best Practices

### For SUPER_ADMIN
1. ✅ Change default password immediately
2. ✅ Use strong, unique passwords (16+ characters)
3. ✅ Enable 2FA when available
4. ✅ Limit number of SUPER_ADMIN accounts
5. ✅ Log all SUPER_ADMIN activities
6. ✅ Use IP whitelisting for access
7. ✅ Regular security audits
8. ✅ Never share credentials

### For ADMIN
1. ✅ Use unique passwords per college
2. ✅ Regular password rotation (90 days)
3. ✅ Audit user creation logs
4. ✅ Monitor suspicious activities
5. ✅ Review department access regularly

### For MODERATOR
1. ✅ Secure exam creation credentials
2. ✅ Don't share exam links publicly
3. ✅ Review violation reports promptly
4. ✅ Verify student identity during exams

### For STUDENT
1. ✅ Keep login credentials private
2. ✅ Don't use public computers for exams
3. ✅ Ensure stable internet connection
4. ✅ Grant necessary permissions (camera/screen)
5. ✅ Report suspicious exam behavior

---

## 📖 Related Documentation

- [SUPERADMIN_SETUP.md](SUPERADMIN_SETUP.md) - Superadmin account setup
- [MULTI_COLLEGE_IMPLEMENTATION.md](MULTI_COLLEGE_IMPLEMENTATION.md) - Multi-college architecture
- [MULTI_COLLEGE_QUICKSTART.md](MULTI_COLLEGE_QUICKSTART.md) - Quick start guide
- [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md) - Cloud deployment guide

---

## 🆘 Troubleshooting

### User Can't Login
1. Verify user exists: `SELECT * FROM users WHERE email = 'user@example.com'`
2. Check role assignment: `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?`
3. Verify account is enabled: `SELECT enabled FROM users WHERE id = ?`
4. Reset password if needed

### User Sees Wrong Data (College Isolation Issue)
1. Check user's college assignment
2. Verify role-based filters are applied
3. Review CollegeSecurityService logic
4. Check RLS policies (if enabled)

### Permission Denied Errors
1. Verify user has correct role
2. Check API endpoint `@PreAuthorize` annotation
3. Review JWT token and authorities
4. Check CustomUserDetails implementation

---

**Last Updated:** March 11, 2026  
**Version:** 1.0  
**Maintainer:** System Administrator
