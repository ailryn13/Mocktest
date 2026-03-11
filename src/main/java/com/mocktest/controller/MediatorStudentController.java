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

import java.util.List;
import java.util.Map;

/**
 * Mediator endpoint for enrolling (registering) students in their department.
 * Secured via SecurityConfig: /api/mediator/** → ROLE_MEDIATOR.
 */
@RestController
@RequestMapping("/api/mediator")
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

    /** Register a new student – role is forced to STUDENT regardless of request body. */
    @PostMapping("/register-student")
    public ResponseEntity<String> registerStudent(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerStudent(request));
    }

    /** List all registered students (for mediator dashboard). */
    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> listStudents() {
        List<Map<String, Object>> students = userRepository.findByRole(Role.STUDENT)
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
}
