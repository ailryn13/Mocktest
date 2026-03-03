package com.mocktest.repositories;

import com.mocktest.models.PasswordResetToken;
import com.mocktest.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    /** Remove all existing tokens for a user before issuing a new one. */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user")
    void deleteAllByUser(User user);

    /** Housekeeping: remove tokens that expired before the given timestamp. */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < :cutoff")
    void deleteExpiredBefore(LocalDateTime cutoff);
}
