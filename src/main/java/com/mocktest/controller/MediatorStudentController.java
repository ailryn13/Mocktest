package com.mocktest.controller;

import com.mocktest.dto.auth.RegisterRequest;
import com.mocktest.dto.department.DepartmentResponse;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.AuthService;
import com.mocktest.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/mediator")
@SuppressWarnings("null")
public class MediatorStudentController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final DepartmentService departmentService;

    public MediatorStudentController(AuthService authService,
                                     UserRepository userRepository,
                                     DepartmentService departmentService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.departmentService = departmentService;
    }

    /** Register a new student – role is forced to STUDENT and department is forced to mediator's department. */
    @PostMapping("/register-student")
    public ResponseEntity<String> registerStudent(@Valid @RequestBody RegisterRequest request, Principal principal) {
        com.mocktest.models.User mediator = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new com.mocktest.exception.ResourceNotFoundException("Mediator not found"));
        
        if (mediator.getDepartment() == null) {
            throw new com.mocktest.exception.BadRequestException("Mediator has no department assigned");
        }
        
        request.setDepartmentId(mediator.getDepartment().getId());
        return ResponseEntity.ok(authService.registerStudent(request));
    }

    /** List all registered students in the mediator's department. */
    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> listStudents(Principal principal) {
        com.mocktest.models.User mediator = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new com.mocktest.exception.ResourceNotFoundException("Mediator not found"));

        if (mediator.getDepartment() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> students = userRepository.findByRoleAndDepartmentId(Role.STUDENT, mediator.getDepartment().getId())
                .stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "department", u.getDepartment() != null ? u.getDepartment().getName() : ""
                ))
                .toList();
        return ResponseEntity.ok(students);
    }

    /** List all departments – used to populate the department dropdown when registering a student. */
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> listDepartments() {
        return ResponseEntity.ok(departmentService.getAll());
    }

    /** Reset a student's password. Restricted to students in the same department. */
    @PutMapping("/students/{id}/password")
    public ResponseEntity<String> updateStudentPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Principal principal) {
        
        String newPassword = request.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            throw new com.mocktest.exception.BadRequestException("Password cannot be empty");
        }

        com.mocktest.models.User mediator = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new com.mocktest.exception.ResourceNotFoundException("Mediator not found"));

        com.mocktest.models.User student = userRepository.findById(id)
                .orElseThrow(() -> new com.mocktest.exception.ResourceNotFoundException("Student not found"));

        // Security check: ensure the target user is a STUDENT and in the SAME department
        if (student.getRole() != Role.STUDENT) {
            throw new com.mocktest.exception.BadRequestException("Can only reset passwords for students");
        }

        if (mediator.getDepartment() == null || student.getDepartment() == null ||
            !mediator.getDepartment().getId().equals(student.getDepartment().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only reset passwords for students in your own department");
        }

        authService.updatePassword(id, newPassword);
        return ResponseEntity.ok("Student password updated successfully");
    }
}
