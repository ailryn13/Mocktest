package com.examportal.controller;

import com.examportal.dto.CreateAdminRequest;
import com.examportal.entity.User;
import com.examportal.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * User Management Controller (SUPER_ADMIN only)
 * Handles creation and management of ADMIN users for colleges
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public class UserManagementController {

    @Autowired
    private UserManagementService userManagementService;

    /**
     * Create ADMIN user for a college
     * SUPER_ADMIN only
     */
    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdminForCollege(@Valid @RequestBody CreateAdminRequest request) {
        try {
            User createdUser = userManagementService.createAdminForCollege(request);
            
            // Return user info without password
            Map<String, Object> response = new HashMap<>();
            response.put("id", createdUser.getId());
            response.put("username", createdUser.getUsername());
            response.put("email", createdUser.getEmail());
            response.put("firstName", createdUser.getFirstName());
            response.put("lastName", createdUser.getLastName());
            response.put("collegeId", createdUser.getCollege() != null ? createdUser.getCollege().getId() : null);
            response.put("collegeName", createdUser.getCollege() != null ? createdUser.getCollege().getName() : null);
            response.put("department", createdUser.getDepartment());
            response.put("enabled", createdUser.isEnabled());
            response.put("message", "Admin user created successfully for college");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all users for a specific college
     */
    @GetMapping("/college/{collegeId}")
    public ResponseEntity<?> getUsersByCollege(@PathVariable Long collegeId) {
        try {
            List<User> users = userManagementService.getUsersByCollege(collegeId);
            
            // Map to safe response (without passwords)
            List<Map<String, Object>> response = users.stream().map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("email", user.getEmail());
                userMap.put("firstName", user.getFirstName());
                userMap.put("lastName", user.getLastName());
                userMap.put("department", user.getDepartment());
                userMap.put("enabled", user.isEnabled());
                userMap.put("roles", user.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .toList());
                return userMap;
            }).toList();
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get users by role and college
     */
    @GetMapping("/college/{collegeId}/role/{roleName}")
    public ResponseEntity<?> getUsersByRoleAndCollege(
            @PathVariable Long collegeId,
            @PathVariable String roleName) {
        try {
            List<User> users = userManagementService.getUsersByRoleAndCollege(roleName.toUpperCase(), collegeId);
            
            // Map to safe response
            List<Map<String, Object>> response = users.stream().map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("email", user.getEmail());
                userMap.put("firstName", user.getFirstName());
                userMap.put("lastName", user.getLastName());
                userMap.put("department", user.getDepartment());
                userMap.put("enabled", user.isEnabled());
                return userMap;
            }).toList();
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Deactivate user
     */
    @PatchMapping("/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long userId) {
        try {
            User user = userManagementService.deactivateUser(userId);
            return ResponseEntity.ok(Map.of(
                "message", "User deactivated successfully",
                "userId", user.getId(),
                "enabled", user.isEnabled()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Activate user
     */
    @PatchMapping("/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long userId) {
        try {
            User user = userManagementService.activateUser(userId);
            return ResponseEntity.ok(Map.of(
                "message", "User activated successfully",
                "userId", user.getId(),
                "enabled", user.isEnabled()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
