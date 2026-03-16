package com.mocktest.controller;

import com.mocktest.service.InvitationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    /** Mediator endpoint for bulk inviting students via Excel. */
    @PostMapping("/mediator/bulk-invite")
    @PreAuthorize("hasRole('MEDIATOR')")
    public ResponseEntity<Map<String, Object>> bulkInvite(@RequestParam("file") MultipartFile file, Principal principal) {
        return ResponseEntity.ok(invitationService.bulkInviteStudents(file, principal));
    }

    /** Public endpoint to validate an invitation token. */
    @GetMapping("/auth/validate-invite")
    public ResponseEntity<Map<String, String>> validateInvite(@RequestParam("token") String token) {
        String email = invitationService.validateToken(token);
        return ResponseEntity.ok(Map.of("email", email));
    }

    /** Public endpoint for students to accept invitation and set password. */
    @PostMapping("/auth/accept-invite")
    public ResponseEntity<Map<String, String>> acceptInvite(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String password = request.get("password");
        
        if (token == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and password are required"));
        }
        
        invitationService.acceptInvitation(token, password);
        return ResponseEntity.ok(Map.of("message", "Account activated successfully. You can now login."));
    }
}
