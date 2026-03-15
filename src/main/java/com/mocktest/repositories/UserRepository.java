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
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u LEFT JOIN FETCH u.department d LEFT JOIN FETCH d.parent WHERE u.email = :email")
    Optional<User> findByEmail(@org.springframework.data.repository.query.Param("email") String email);

    /** Check whether an email is already registered. */
    boolean existsByEmail(String email);

    /** Fetch all users that share a given role, pre-loading department and its parent. */
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u LEFT JOIN FETCH u.department d LEFT JOIN FETCH d.parent WHERE u.role = :role")
    List<User> findByRoleWithDepartment(Role role);

    /** Fetch all users that share a given role (standard). */
    List<User> findByRole(Role role);

    /** Fetch all mediators belonging to a college or its sub-departments. */
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u JOIN FETCH u.department d LEFT JOIN FETCH d.parent WHERE u.role = 'MEDIATOR' AND (d.id = :collegeId OR d.parent.id = :collegeId)")
    List<User> findMediatorsByCollegeId(@org.springframework.data.repository.query.Param("collegeId") Long collegeId);

    /** Fetch all users belonging to a specific department. */
    List<User> findByDepartmentId(Long departmentId);

    /** Fetch all users with a specific role and department. */
    List<User> findByRoleAndDepartmentId(Role role, Long departmentId);
}
