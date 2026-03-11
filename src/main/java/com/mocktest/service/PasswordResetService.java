package com.mocktest.service;

import com.mocktest.models.PasswordResetToken;
import com.mocktest.models.User;
import com.mocktest.repositories.PasswordResetTokenRepository;
import com.mocktest.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Handles the "forgot password" and "reset password" flows.
 */
@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.mail.username:ganeshkumarngk2005@gmail.com}")
    private String mailFrom;

    @Value("${app.mail.from-name:MockTest Platform}")
    private String mailFromName;

    @Value("${app.frontend-url:https://mock-test.duckdns.org}")
    private String frontendUrl;

    @Value("${app.password-reset-token-expiry-hours:1}")
    private int tokenExpiryHours;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                JavaMailSender mailSender,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Generates a reset token and sends an email.
     * Silently no-ops when the email is not registered (anti-enumeration).
     */
    @Transactional
    public void generateAndSendResetToken(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return; // do not reveal whether the email exists
        }
        User user = userOpt.get();

        // Invalidate any previous tokens for this user
        tokenRepository.deleteAllByUser(user);

        String rawToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(tokenExpiryHours);
        tokenRepository.save(new PasswordResetToken(rawToken, user, expiry));

        String resetLink = frontendUrl + "/reset-password?token=" + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFromName + " <" + mailFrom + ">");
        message.setTo(user.getEmail());
        message.setSubject("MockTest – Reset your password");
        message.setText(
                "Hi " + user.getName() + ",\n\n" +
                "We received a request to reset your MockTest password.\n\n" +
                "Click the link below to set a new password (valid for " + tokenExpiryHours + " hour):\n" +
                resetLink + "\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "– The MockTest Team"
        );
        mailSender.send(message);
    }

    /**
     * Validates the token and updates the user's password.
     *
     * @throws IllegalArgumentException when the token is invalid, expired or already used.
     */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken prt = tokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (!prt.isValid()) {
            throw new IllegalArgumentException("Reset token has expired or already been used");
        }

        User user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        tokenRepository.save(prt);
    }
}
