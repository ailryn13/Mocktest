package com.mocktest.controller;

import com.mocktest.dto.auth.RegisterRequest;
import com.mocktest.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Mediator endpoint for enrolling (registering) students in their department.
 * Secured via SecurityConfig: /api/mediator/** → ROLE_MEDIATOR.
 */
@RestController
@RequestMapping("/api/mediator")
public class MediatorStudentController {

    private final AuthService authService;

    public MediatorStudentController(AuthService authService) {
        this.authService = authService;
    }

    /** Register a new student – role is forced to STUDENT regardless of request body. */
    @PostMapping("/register-student")
    public ResponseEntity<String> registerStudent(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerStudent(request));
    }
}
