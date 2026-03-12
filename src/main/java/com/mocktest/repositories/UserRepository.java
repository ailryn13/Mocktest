package com.mocktest.repositories;

import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Lookup a user by their unique email (used during authentication). */
    Optional<User> findByEmail(String email);

    /** Check whether an email is already registered. */
    boolean existsByEmail(String email);

    /** Fetch all users that share a given role (e.g. all STUDENTs). */
    List<User> findByRole(Role role);

    /** Fetch all users belonging to a specific department. */
    List<User> findByDepartmentId(Long departmentId);

    /** Fetch all users with a specific role and department. */
    List<User> findByRoleAndDepartmentId(Role role, Long departmentId);
}
