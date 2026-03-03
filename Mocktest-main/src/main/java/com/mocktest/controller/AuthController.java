package com.mocktest.controller;

import com.mocktest.dto.auth.LoginRequest;
import com.mocktest.dto.auth.LoginResponse;
import com.mocktest.service.AuthService;
import com.mocktest.service.PasswordResetService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public endpoint for login and password-reset flows.
 * Registration is handled by admin/mediator controllers.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ------------------------------------------------------------------ //
    //  Password reset                                                      //
    // ------------------------------------------------------------------ //

    record ForgotPasswordRequest(@Email @NotBlank String email) {}
    record ResetPasswordRequest(@NotBlank String token, @Size(min = 8) @NotBlank String newPassword) {}

    /**
     * Step 1 – user submits their email.
     * Always returns 200 to avoid revealing whether the email is registered.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.generateAndSendResetToken(request.email());
        } catch (Exception ignored) {
            // swallow all errors – never reveal internal state
        }
        return ResponseEntity.ok(Map.of("message",
                "If that email is registered, a reset link has been sent."));
    }

    /**
     * Step 2 – user submits the token from the email + new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }
}
