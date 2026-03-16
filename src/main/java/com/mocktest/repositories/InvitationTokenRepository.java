package com.mocktest.repositories;

import com.mocktest.models.InvitationToken;
import com.mocktest.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvitationTokenRepository extends JpaRepository<InvitationToken, Long> {
    Optional<InvitationToken> findByToken(String token);
    void deleteByStudent(User student);
}
