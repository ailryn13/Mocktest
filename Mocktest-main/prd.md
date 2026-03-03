📄 Product Requirements Document (PRD): Secure Mock Test Platform
1. Overview and Objectives
Develop a robust, highly secure, and multithreaded online examination platform. The system will evaluate students through Multiple Choice Questions (MCQs) and Live Coding challenges. It must prevent malpractice and enforce strict Role-Based Access Control (RBAC) across departments.

2. Technology Stack
Backend: Java (Spring Boot) - Chosen for native multithreading and robust security.

Database: PostgreSQL (using Spring Data JPA for ORM).

Frontend: React.js or Next.js (Client's choice, but React is standard for this).

Security: Spring Security with JWT (JSON Web Tokens).

Code Execution: Sandboxed environment (e.g., Docker containers or secure third-party API like Judge0) to safely compile and run student code submissions.

3. User Roles & Access Control
Admin: Has absolute control. Can create Departments and register Mediators.

Mediator: Assigned to a specific Department. Can create exams (MCQs and Coding questions), enroll Students in their department, and view grading reports.

Student: Assigned to a specific Department. Can only log in, view assigned active tests, take the test within a secure browser environment, and view their final scores.

4. Core Modules & Features
A. Authentication & Security Module

Secure login using email and encrypted passwords (BCrypt).

Stateless session management using JWT.

Strict endpoint protection (e.g., /api/admin/** only accessible by Admins).

B. Exam Engine Module

MCQ Engine: Handles displaying questions, recording selected options, and auto-grading upon submission.

Coding Engine: Provides an in-browser code editor (e.g., Monaco Editor). Accepts student code in various languages (Java, Python, C++), runs it against hidden test cases, and returns a pass/fail status and execution time.

C. Anti-Malpractice (Proctoring) Module

Frontend event listeners to detect tab switching, losing window focus, or exiting full-screen mode.

Disable copy/paste functionality inside the test environment.

Backend endpoint to log every violation. If violations exceed a threshold (e.g., 3 tab switches), the test automatically locks and submits the current progress.

5. Database Schema Structure (PostgreSQL)
users: id, name, email, password_hash, role (Enum), department_id.

departments: id, name.

exams: id, title, mediator_id, start_time, end_time, duration_minutes.

questions: id, exam_id, type (MCQ or CODING), content, options (JSON), correct_answer, test_cases (JSON for coding).

submissions: id, user_id, exam_id, score, submitted_at.

malpractice_logs: id, session_id, violation_type, timestamp.