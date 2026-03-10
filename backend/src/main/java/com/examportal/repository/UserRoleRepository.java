package com.examportal.repository;

import com.examportal.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserId(Long userId);
    
    List<UserRole> findByRoleId(Long roleId);
    
    Optional<UserRole> findByUserIdAndRoleId(Long userId, Long roleId);
    
    void deleteByUserId(Long userId);
    
    void deleteByUserIdAndRoleId(Long userId, Long roleId);
}
