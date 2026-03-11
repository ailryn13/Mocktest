# Roles and Responsibilities Guide (Restored & Aligned)

Complete reference for all user roles, their capabilities, and access permissions in the **Mocktest Platform**.

---

## 📊 Role Hierarchy

```
SUPER_ADMIN (System-wide Administrator)
    ↓
ADMIN (College/Institution Administrator)
    ↓
MEDIATOR (Exam Creator/Proctor)
    ↓
STUDENT (Exam Taker)
```

---

## 🎭 Role Definitions

### 1. 👑 SUPER_ADMIN (System Administrator)
**Access Level:** Global system access  
**Authority:** The "Master" account. Manages the entire platform infrastructure and initial setup.

#### ✅ Capabilities
- **System Control**: Manage all colleges/institutions in the system.
- **User Management**: Create and manage **ADMIN** accounts for different colleges.
- **Global Overview**: Monitor activity across all institutions.
- **Database Control**: Highest permission level for system configurations.

#### 🛠️ Default Credentials
- **Email:** `superadmin@mocktest.app`
- **Password:** `SuperAdmin@123456`

---

### 2. 🏢 ADMIN (College Administrator)
**Access Level:** Institution-wide access  
**Authority:** Manages all operations within their specific college or institution.

#### ✅ Capabilities
- **College Setup**: Manage departments within the institution.
- **Staffing**: Create and manage **MEDIATOR** (Moderator) accounts.
- **Student Enrollment**: Onboard and manage **STUDENT** accounts for the college.
- **Analytics**: View institution-wide performance reports and statistics.

---

### 3. 📝 MEDIATOR (Exam Creator/Proctor)
**Access Level:** Department-restricted  
**Authority:** The "Professor" role. Responsible for the actual content and integrity of exams.

#### ✅ Capabilities
- **Exam Cycle**: Create, schedule, and publish MCQ and Coding exams.
- **Question Banking**: Manage the question library and Judge0 test cases.
- **Real-time Proctoring**: Monitor live student sessions and violation counts.
- **Manual Verification**: Review and approve code solutions that require human intervention.

---

### 4. 🎓 STUDENT (Exam Taker)
**Access Level:** Personal data only  
**Authority:** The end-user who takes the tests.

#### ✅ Capabilities
- **Test Taking**: Access and complete exams assigned to their department.
- **Live IDE**: Write, compile, and run code in the secure integrated sandbox.
- **Performance Tracking**: View own scoring history and review marked results.

---

## 🔒 Security & Compliance
- **Tab Tracking**: Alerts mediators when a student loses focus on the exam tab.
- **JWT Security**: All roles are protected by stateless token authentication.
- **Judge0 Isolation**: Student code runs in restricted containers to prevent server attacks.

---

**Last Updated:** March 11, 2026  
**Status:** Aligned (Backend + Frontend)
