package com.examportal.controller;

import com.examportal.dto.DepartmentRequest;
import com.examportal.dto.DepartmentResponse;
import com.examportal.dto.RegisterModeratorRequest;
import com.examportal.entity.User;
import com.examportal.security.CustomUserDetails;
import com.examportal.service.DepartmentService;
import com.examportal.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Controller
 * Handles college admin operations (department management, etc.)
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final DepartmentService departmentService;
    private final UserManagementService userManagementService;

    /**
     * Get all departments for the admin's college
     */
    @GetMapping("/departments")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<DepartmentResponse>> getDepartments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Admin {} fetching departments for college ID: {}", 
                userDetails.getUsername(), userDetails.getCollegeId());
        
        if (userDetails.getCollegeId() == null) {
            throw new IllegalStateException("Admin user must be assigned to a college");
        }
        
        List<DepartmentResponse> departments = departmentService.getAllByCollege(userDetails.getCollegeId());
        return ResponseEntity.ok(departments);
    }

    /**
     * Create a new department
     */
    @PostMapping("/departments")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<DepartmentResponse> createDepartment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DepartmentRequest request) {
        
        log.info("Admin {} creating department: {}", userDetails.getUsername(), request.getName());
        
        if (userDetails.getCollegeId() == null) {
            throw new IllegalStateException("Admin user must be assigned to a college");
        }
        
        DepartmentResponse response = departmentService.create(userDetails.getCollegeId(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Update a department
     */
    @PutMapping("/departments/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request) {
        
        log.info("Admin {} updating department ID: {}", userDetails.getUsername(), id);
        
        if (userDetails.getCollegeId() == null) {
            throw new IllegalStateException("Admin user must be assigned to a college");
        }
        
        DepartmentResponse response = departmentService.update(userDetails.getCollegeId(), id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a department
     */
    @DeleteMapping("/departments/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        log.info("Admin {} deleting department ID: {}", userDetails.getUsername(), id);
        
        if (userDetails.getCollegeId() == null) {
            throw new IllegalStateException("Admin user must be assigned to a college");
        }
        
        departmentService.delete(userDetails.getCollegeId(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Register a new moderator (admin only)
     * Moderator will be assigned to the admin's college
     */
    @PostMapping("/register-mediator")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> registerModerator(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody RegisterModeratorRequest request) {
        
        log.info("Admin {} registering moderator: {}", userDetails.getUsername(), request.getEmail());
        
        if (userDetails.getCollegeId() == null) {
            throw new IllegalStateException("Admin user must be assigned to a college");
        }
        
        User moderator = userManagementService.createModeratorForCollege(userDetails.getCollegeId(), request);
        
        return ResponseEntity.ok("Moderator registered successfully: " + moderator.getEmail());
    }
}
