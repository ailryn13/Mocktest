package com.mocktest.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    // 64-byte secret for HS512 (must be at least 64 bytes for HMAC-SHA)
    private static final String TEST_SECRET =
            "bXktc3VwZXItc2VjcmV0LWtleS1mb3ItbW9ja3Rlc3QtcGxhdGZvcm0tMjAyNi1qd3Q=";
    private static final long TEST_EXPIRATION_MS = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(TEST_SECRET, TEST_EXPIRATION_MS);
    }

    @Test
    void generateToken_returnsNonNullToken() {
        // Act
        String token = tokenProvider.generateToken("user@test.com", "STUDENT");

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void getEmailFromToken_returnsCorrectEmail() {
        // Arrange
        String token = tokenProvider.generateToken("user@test.com", "STUDENT");

        // Act
        String email = tokenProvider.getEmailFromToken(token);

        // Assert
        assertEquals("user@test.com", email);
    }

    @Test
    void getRoleFromToken_returnsCorrectRole() {
        // Arrange
        String token = tokenProvider.generateToken("user@test.com", "ADMIN");

        // Act
        String role = tokenProvider.getRoleFromToken(token);

        // Assert
        assertEquals("ADMIN", role);
    }

    @Test
    void validateToken_withValidToken_returnsTrue() {
        // Arrange
        String token = tokenProvider.generateToken("user@test.com", "MEDIATOR");

        // Act
        boolean isValid = tokenProvider.validateToken(token);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void validateToken_withInvalidToken_returnsFalse() {
        // Act
        boolean isValid = tokenProvider.validateToken("invalid.token.here");

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_withNullToken_returnsFalse() {
        // Act
        boolean isValid = tokenProvider.validateToken(null);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_withEmptyToken_returnsFalse() {
        // Act
        boolean isValid = tokenProvider.validateToken("");

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_withExpiredToken_returnsFalse() {
        // Arrange: create provider with 0ms expiration
        JwtTokenProvider expiredProvider = new JwtTokenProvider(TEST_SECRET, 0L);
        String token = expiredProvider.generateToken("user@test.com", "STUDENT");

        // Act - token generated with 0ms expiration should be expired immediately
        // Small race condition possible, so we add a tiny sleep
        try { Thread.sleep(10); } catch (InterruptedException ignored) {}
        boolean isValid = expiredProvider.validateToken(token);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void generateToken_differentUsersProduceDifferentTokens() {
        // Act
        String token1 = tokenProvider.generateToken("user1@test.com", "STUDENT");
        String token2 = tokenProvider.generateToken("user2@test.com", "ADMIN");

        // Assert
        assertNotEquals(token1, token2);
    }

    @Test
    void tokenRoundTrip_preservesAllClaims() {
        // Arrange
        String email = "roundtrip@test.com";
        String role = "MEDIATOR";

        // Act
        String token = tokenProvider.generateToken(email, role);
        String extractedEmail = tokenProvider.getEmailFromToken(token);
        String extractedRole = tokenProvider.getRoleFromToken(token);

        // Assert
        assertEquals(email, extractedEmail);
        assertEquals(role, extractedRole);
    }
}
