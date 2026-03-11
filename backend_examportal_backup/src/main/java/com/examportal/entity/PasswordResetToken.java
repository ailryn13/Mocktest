package com.examportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Stores one-time password-reset tokens.
 * Each token is valid for a configurable number of hours (default 1 h)
 * and can only be used once.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The unique opaque token sent in the reset email. */
    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Builder.Default
    private boolean used = false;

    /** Returns {@code true} if the token has not yet expired and has not been used. */
    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiryDate);
    }
}
