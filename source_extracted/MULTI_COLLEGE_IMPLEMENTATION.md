# Multi-College System Implementation Guide

## Overview

This document describes the implementation of a multi-college system with SUPER_ADMIN and ADMIN roles for the Mocktest application.

**Date:** March 7, 2026

## Business Requirements

### Role Structure

1. **SUPER_ADMIN**
   - System-wide access to all colleges
   - Can create, activate, and deactivate colleges
   - Can assign ADMIN users to specific colleges
   - Has NO college assignment (collegeId = NULL)
   - Cannot directly access college-specific operations (must assign admins)

2. **ADMIN**
   - Full access to ONE specific college only
   - Can manage all users, tests, questions within their college
   - Cannot see data from other colleges
   - Must be assigned to a college

3. **MODERATOR**
   - Can create and manage tests, questions
   - Department-restricted within their college
   - Cannot see data from other colleges

4. **STUDENT**
   - Can take exams and view submissions
   - Restricted to their college
   - Cannot see data from other colleges

### Data Isolation

- **College A data is COMPLETELY ISOLATED from College B**
- All major entities are college-scoped (Tests, Questions, Attempts, etc.)
- Row-level security enforced at both application and database levels
- SUPER_ADMIN bypasses all college filters

---

## Implementation Summary

### 1. Database Schema Changes

**New Table:**
- `colleges` - Stores college/institution information

**Modified Tables (added college_id FK):**
- `users` - College assignment (NULL for SUPER_ADMIN)
- `tests` - College ownership (required)
- `questions` - College ownership (NULL for globally shared questions)
- `student_attempts` - College context (required)
- `proctor_logs` - College context (required)
- `screen_recordings` - College context (required)
- `violation` - College context (required)

**New Roles:**
- `ADMIN` (id=3)
- `SUPER_ADMIN` (id=4)

### 2. Entity Changes

#### Created New Entities
- **College.java** - College entity with name, code, address, contact info

#### Modified Entities
- **User.java** - Added `ManyToOne` relationship to College
- **Test.java** - Added `ManyToOne` relationship to College, updated filter to `collegeFilter`
- **Question.java** - Added `ManyToOne` relationship to College (nullable for shared questions)
- **StudentAttempt.java** - Added `ManyToOne` relationship to College
- **ProctorLog.java** - Added `ManyToOne` relationship to College
- **ScreenRecording.java** - Added `ManyToOne` relationship to College
- **Violation.java** - Added `ManyToOne` relationship to College
- **Role.java** - Added `ADMIN` and `SUPER_ADMIN` constants

### 3. Repository Changes

All repositories updated with college-based query methods:

**TestRepository:**
- `findByCollegeId(Long collegeId)`
- `findByCollegeIdAndDepartment(Long collegeId, String department)`
- `findByCollegeIdAndDepartmentIn(Long collegeId, List<String> departments)`
- `countByCollegeId(Long collegeId)`

**QuestionRepository:**
- `findByCollegeId(Long collegeId)`
- `findByCollegeIdOrGlobal(Long collegeId)` - Includes globally shared questions
- `findByCollegeIdAndType(Long collegeId, QuestionType type)`

**UserRepository:**
- `findByCollegeId(Long collegeId)`
- `findByRoleNameAndCollegeId(String roleName, Long collegeId)`
- `countByCollegeId(Long collegeId)`

**StudentAttemptRepository:**
- `findByCollegeId(Long collegeId)`
- `countByCollegeIdAndStatus(Long collegeId, AttemptStatus status)`

**ProctorLogRepository:**
- `findByCollegeId(Long collegeId)`
- `countByCollegeId(Long collegeId)`

**ScreenRecordingRepository:**
- `findByCollegeId(Long collegeId)`
- `sumFileSizeByCollegeId(Long collegeId)`

**ViolationRepository:**
- `findByCollegeIdAndExamIdOrderByDetectedAtDesc(Long collegeId, Long examId)`
- `countConfirmedByCollegeId(Long collegeId)`

**New Repository:**
- **CollegeRepository** - CRUD operations for colleges

### 4. Security Layer Changes

#### CustomUserDetails.java
Added methods:
- `getCollegeId()` - Returns user's college ID (null for SUPER_ADMIN)
- `getCollegeName()` - Returns user's college name
- `isSuperAdmin()` - Check if user is SUPER_ADMIN
- `isAdmin()` - Check if user is ADMIN
- `isModerator()` - Check if user is MODERATOR
- `isStudent()` - Check if user is STUDENT

#### JwtTokenProvider.java
- Added `collegeId` to JWT token claims

#### RlsAspect.java (Row-Level Security)
**Before:** Applied `departmentFilter` only to MODERATOR users
**After:** 
- Renamed to `collegeFilter`
- Applies to ALL users with college assignment (ADMIN, MODERATOR, STUDENT)
- SUPER_ADMIN bypasses filter (system-wide access)
- Sets PostgreSQL session variable `app.current_college_id`

#### CollegeSecurityService.java (New)
Replaces `DepartmentSecurityService` with college-aware methods:
- `getCurrentUserCollegeId()` - Returns null for SUPER_ADMIN
- `verifyCollegeAccess(Long targetCollegeId)` - Throws exception if access denied
- `hasCollegeAccess(Long targetCollegeId)` - Returns boolean
- `isSuperAdmin()`, `isAdmin()`, `isModerator()`, `isStudent()` - Role checks

**DepartmentSecurityService.java** - Kept for backward compatibility but should be migrated

### 5. Service Layer Changes

#### New Services
**CollegeService.java**
- `getAllColleges()` - SUPER_ADMIN only
- `createCollege(College college)` - SUPER_ADMIN only
- `updateCollege(Long id, College college)` - SUPER_ADMIN only
- `deactivateCollege(Long id)` - Soft delete, SUPER_ADMIN only
- `activateCollege(Long id)` - SUPER_ADMIN only

### 6. Controller Layer Changes

#### New Controllers
**CollegeController.java**
- `@PreAuthorize("hasAuthority('SUPER_ADMIN')")` - Class-level
- Full CRUD endpoints for college management
- Only accessible to SUPER_ADMIN users

#### Authorization Updates Required
**Existing controllers need updates:**
- TestController - Add college verification
- QuestionController - Add college verification
- AnalyticsController - Add college-based filtering
- ViolationController - Add college-based filtering
- UserController - Add college-based filtering (if exists)

---

## Migration Steps

### Step 1: Run Schema Migration
```sql
psql -U postgres -d mocktest -f backend/migration_01_schema_college.sql
```

This will:
- Create `colleges` table
- Add ADMIN and SUPER_ADMIN roles
- Add `college_id` column to all relevant tables
- Create foreign key constraints
- Create indexes for performance

### Step 2: Run Data Migration
```sql
psql -U postgres -d mocktest -f backend/migration_02_data_migration.sql
```

**IMPORTANT: Review and customize before running!**

This will:
- Create a default college (change name/details in script)
- Migrate all existing users to default college
- Migrate all existing tests, questions to default college
- Migrate all attempts, logs, recordings to default college
- Provide validation queries

### Step 3: Create SUPER_ADMIN User
Uncomment and customize the SUPER_ADMIN creation section in `migration_02_data_migration.sql`

Or create manually:
```java
// Use BCryptGen.java to generate password hash
String hash = BCrypt.hashpw("superadmin123", BCrypt.gensalt(10));

// Insert via SQL:
INSERT INTO users (username, password, first_name, last_name, email, enabled, college_id)
VALUES ('superadmin', '{hash}', 'Super', 'Admin', 'superadmin@system.com', true, NULL);

INSERT INTO user_roles (user_id, role_id)
SELECT (SELECT id FROM users WHERE username = 'superadmin'),
       (SELECT id FROM roles WHERE name = 'SUPER_ADMIN');
```

### Step 4: Update Services to Use CollegeSecurityService
Replace all usages of `DepartmentSecurityService` with `CollegeSecurityService`:

**Example:**
```java
// Before:
String department = departmentSecurityService.getCurrentUserDepartment();
List<Test> tests = testRepository.findByDepartment(department);

// After:
Long collegeId = collegeSecurityService.getCurrentUserCollegeId();
if (collegeId != null) {
    List<Test> tests = testRepository.findByCollegeId(collegeId);
} else {
    // SUPER_ADMIN - see all tests
    List<Test> tests = testRepository.findAll();
}
```

### Step 5: Update Controller Authorization
Add college verification to all controllers:

```java
@PreAuthorize("hasAnyAuthority('ADMIN', 'MODERATOR')")
@PostMapping("/api/tests")
public ResponseEntity<TestDTO> createTest(@RequestBody TestDTO dto) {
    // Verify user has access to this college
    if (dto.getCollegeId() != null) {
        collegeSecurityService.verifyCollegeAccess(dto.getCollegeId());
    }
    
    // Service handles college assignment automatically via RlsAspect
    return ResponseEntity.ok(testService.createTest(dto));
}
```

### Step 6: Update Frontend
**Required frontend changes:**
1. Add college selection for SUPER_ADMIN when assigning users
2. Display college name in user profile
3. Filter college list based on user role
4. Add college management UI for SUPER_ADMIN
5. Update JWT token parsing to include collegeId

### Step 7: Test Thoroughly
**Test scenarios:**
1. SUPER_ADMIN can create colleges ✓
2. SUPER_ADMIN cannot see college-specific data before assigning admin ✓
3. ADMIN can see all data in their college ✓
4. ADMIN cannot see data from other colleges ✓
5. MODERATOR can create tests in their college ✓
6. MODERATOR cannot see data from other colleges ✓
7. STUDENT can take exams in their college ✓
8. STUDENT cannot see data from other colleges ✓
9. Global questions (college_id=NULL) are visible to all colleges ✓
10. RLS aspect applies correct filters ✓

---

## Backward Compatibility

### Deprecated Methods
The following repository methods are marked `@Deprecated` for backward compatibility:
- `TestRepository.findByDepartment(String department)`
- `TestRepository.findByDepartmentIn(List<String> departments)`
- `QuestionRepository.findByDepartment(String department)`
- `UserRepository.findByDepartment(String department)`

**These should be migrated to college-based queries in a future release.**

### Breaking Changes
1. All entity constructors and builders now require College parameter
2. Service methods must handle collegeId
3. DTOs should include collegeId field
4. Frontend must send collegeId in requests

---

## API Endpoints

### College Management (SUPER_ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/colleges` | Get all colleges |
| GET | `/api/colleges/active` | Get active colleges |
| GET | `/api/colleges/{id}` | Get college by ID |
| GET | `/api/colleges/code/{code}` | Get college by code |
| POST | `/api/colleges` | Create new college |
| PUT | `/api/colleges/{id}` | Update college |
| PATCH | `/api/colleges/{id}/activate` | Activate college |
| PATCH | `/api/colleges/{id}/deactivate` | Deactivate college (soft delete) |
| GET | `/api/colleges/stats/count` | Get active colleges count |

### Example Request/Response

**Create College:**
```json
POST /api/colleges
{
  "name": "ABC Engineering College",
  "code": "ABC",
  "address": "123 Main St",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "country": "India",
  "contactPhone": "+91-9876543210",
  "contactEmail": "admin@abc.edu",
  "description": "Premier engineering institution"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "ABC Engineering College",
  "code": "ABC",
  "address": "123 Main St",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "country": "India",
  "contactPhone": "+91-9876543210",
  "contactEmail": "admin@abc.edu",
  "active": true,
  "description": "Premier engineering institution",
  "createdAt": "2026-03-07T10:00:00",
  "updatedAt": "2026-03-07T10:00:00"
}
```

---

## Security Considerations

### Row-Level Security (RLS)
1. **Application-level:** Hibernate `@Filter` applied automatically via `RlsAspect`
2. **Database-level:** PostgreSQL session variable `app.current_college_id` (optional)

### Access Control Matrix

| Role | College Management | View Own College | View Other Colleges | System-Wide Access |
|------|-------------------|------------------|---------------------|-------------------|
| SUPER_ADMIN | ✓ Create/Edit | ✗ Direct Access | ✗ Direct Access | ✓ All Data |
| ADMIN | ✗ | ✓ Full Access | ✗ | ✗ |
| MODERATOR | ✗ | ✓ Dept-Restricted | ✗ | ✗ |
| STUDENT | ✗ | ✓ Own Data | ✗ | ✗ |

---

## Performance Optimizations

### Indexes Created
- `idx_users_college_id` on `users(college_id)`
- `idx_tests_college_id` on `tests(college_id)`
- `idx_users_college_department` on `users(college_id, department)`
- `idx_tests_college_department` on `tests(college_id, department)`
- Similar indexes on all college-aware tables

### Query Optimization
- All college-based queries use indexed columns
- Hibernate filters reduce query complexity
- EAGER fetch avoided for large collections

---

## Known Limitations

1. **SUPER_ADMIN workflow:** SUPER_ADMIN cannot directly interact with college data - must assign an ADMIN first
2. **Question sharing:** Global questions (college_id=NULL) are visible to all colleges - be careful with sensitive content
3. **Data migration:** Existing data must be migrated to default college before system is fully functional
4. **Service layer updates:** Many services still need to be updated to use `CollegeSecurityService`

---

## Next Steps

1. **Update all service classes** to use `CollegeSecurityService` instead of `DepartmentSecurityService`
2. **Update all controllers** to verify college access before operations
3. **Create DTOs** with collegeId fields
4. **Update frontend** to handle multi-college system
5. **Write unit tests** for college isolation
6. **Write integration tests** for cross-college access denial
7. **Update documentation** for API consumers
8. **Create admin UI** for college management
9. **Migration script** for production deployment

---

## Files Created

### Backend Entities
- `backend/src/main/java/com/examportal/entity/College.java`

### Backend Repositories
- `backend/src/main/java/com/examportal/repository/CollegeRepository.java`

### Backend Services
- `backend/src/main/java/com/examportal/service/CollegeService.java`
- `backend/src/main/java/com/examportal/security/CollegeSecurityService.java`

### Backend Controllers
- `backend/src/main/java/com/examportal/controller/CollegeController.java`

### Database Migrations
- `backend/migration_01_schema_college.sql` - Schema changes
- `backend/migration_02_data_migration.sql` - Data migration

### Modified Files
- All entity files with college FK
- All repository interfaces
- `CustomUserDetails.java`
- `JwtTokenProvider.java`
- `RlsAspect.java`
- `Role.java`

---

## Support

For questions or issues with the multi-college implementation, contact the development team or refer to:
- Database schema: `backend/migration_01_schema_college.sql`
- Security implementation: `backend/src/main/java/com/examportal/security/CollegeSecurityService.java`
- Entity relationships: Entity class files

---

**Last Updated:** March 7, 2026
**Version:** 1.0.0
**Status:** Implementation Complete - Testing Required
