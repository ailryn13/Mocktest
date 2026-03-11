package com.examportal.repository;

import com.examportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // College-based queries
    List<User> findByCollegeId(Long collegeId);
    
    List<User> findByCollegeIdAndDepartment(Long collegeId, String department);
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE r.name = :roleName AND u.college.id = :collegeId")
    List<User> findByRoleNameAndCollegeId(@Param("roleName") String roleName, @Param("collegeId") Long collegeId);
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE r.name = :roleName AND u.college.id = :collegeId AND u.department = :department")
    List<User> findByRoleNameAndCollegeIdAndDepartment(@Param("roleName") String roleName, @Param("collegeId") Long collegeId, @Param("department") String department);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.college.id = :collegeId")
    long countByCollegeId(@Param("collegeId") Long collegeId);
    
    // SUPER_ADMIN queries (no college restriction)
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);
    
    // Legacy department-only queries (deprecated)
    @Deprecated
    List<User> findByDepartment(String department);
    
    @Deprecated
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE r.name = :roleName AND u.department = :department")
    List<User> findByRoleNameAndDepartment(@Param("roleName") String roleName, @Param("department") String department);
}
