package com.mocktest.controller;

import com.mocktest.dto.auth.RegisterRequest;
import com.mocktest.dto.auth.UserResponse;
import com.mocktest.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only endpoints.
 * Secured via SecurityConfig: /api/admin/** → ROLE_ADMIN.
 * Department CRUD is handled by DepartmentController at /api/admin/departments.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    /** Register a new mediator – role is forced to MEDIATOR regardless of request body. */
    @PostMapping("/register-mediator")
    public ResponseEntity<String> registerMediator(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.registerMediator(request));
    }

    @GetMapping("/mediators")
    public ResponseEntity<java.util.List<UserResponse>> getAllMediators() {
        return ResponseEntity.ok(authService.getAllMediators());
    }

    @PutMapping("/mediators/{id}")
    public ResponseEntity<UserResponse> updateMediator(@PathVariable Long id, @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.updateMediator(id, request));
    }

    @DeleteMapping("/mediators/{id}")
    public ResponseEntity<Void> deleteMediator(@PathVariable Long id) {
        authService.deleteMediator(id);
        return ResponseEntity.noContent().build();
    }
}
