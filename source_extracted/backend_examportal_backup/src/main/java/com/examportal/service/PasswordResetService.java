package com.examportal.service;

import com.examportal.entity.PasswordResetToken;
import com.examportal.entity.User;
import com.examportal.repository.PasswordResetTokenRepository;
import com.examportal.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Handles the forgot-password / reset-password flow:
 * 1. generateAndSendResetToken  – creates a token and e-mails the link
 * 2. resetPassword              – validates the token and updates the password
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.password-reset-token-expiry-hours:1}")
    private int tokenExpiryHours;

    @Value("${spring.mail.username:noreply@mocktest.app}")
    private String fromEmail;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                @Autowired(required = false) JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    /**
     * Generates a reset token for the given email and sends the link.
     * If the email is not registered we silently succeed to avoid enumeration.
     */
    @Transactional
    public void generateAndSendResetToken(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Invalidate any previous token for this user
            tokenRepository.deleteAllByUser(user);

            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = PasswordResetToken.builder()
                    .token(tokenValue)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusHours(tokenExpiryHours))
                    .build();
            tokenRepository.save(token);

            sendResetEmail(user, tokenValue);
            log.info("Password reset token generated for user: {}", email);
        });
    }

    /**
     * Validates the token and updates the user's password.
     *
     * @throws IllegalArgumentException if the token is invalid or expired
     */
    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (!token.isValid()) {
            throw new IllegalArgumentException("Password reset token has expired or has already been used");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    // -------------------------------------------------------------------------
    //  Private helpers
    // -------------------------------------------------------------------------

    private void sendResetEmail(User user, String tokenValue) {
        String resetLink = frontendUrl + "/reset-password?token=" + tokenValue;
        String firstName = user.getFirstName() != null ? user.getFirstName() : user.getEmail();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("MockTest – Password Reset Request");
        message.setText(
                "Hi " + firstName + ",\n\n" +
                "We received a request to reset your MockTest account password.\n\n" +
                "Click the link below to set a new password (valid for " + tokenExpiryHours + " hour):\n\n" +
                resetLink + "\n\n" +
                "If you did not request a password reset, please ignore this email – " +
                "your password will remain unchanged.\n\n" +
                "Thanks,\nThe MockTest Team"
        );

        if (mailSender == null) {
            log.warn("Mail sender not configured. Password reset link (for development): {}", resetLink);
            return;
        }
        
        try {
            mailSender.send(message);
            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
            throw new RuntimeException("Failed to send reset email. Please try again later.");
        }
    }
}
