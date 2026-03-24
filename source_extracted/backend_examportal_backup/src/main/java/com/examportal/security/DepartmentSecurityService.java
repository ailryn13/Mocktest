package com.examportal.security;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Department Security Service
 * 
 * Provides row-level security by filtering queries based on user's department
 * Ensures ECE moderators cannot see CSE data
 * 
 * Usage:
 * Specification<Exam> spec = departmentSecurityService.hasDepartmentAccess();
 * examRepository.findAll(spec);
 */
@Service
public class DepartmentSecurityService {

    public DepartmentSecurityService() {
    }

    /**
     * Get current authenticated user's department
     */
    public String getCurrentUserDepartment() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getDepartment();
        }

        throw new IllegalStateException("No authenticated user found");
    }

    /**
     * Get current authenticated user's ID
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }

        throw new IllegalStateException("No authenticated user found");
    }

    /**
     * Get department filter specification
     */
    public <T> Specification<T> hasDepartmentAccess(String departmentField) {
        return (root, query, criteriaBuilder) -> {
            String userDepartment = getCurrentUserDepartment();
            return criteriaBuilder.equal(root.get(departmentField), userDepartment);
        };
    }

    /**
     * Verify user has access to specific department
     * Throws exception if access denied
     */
    public void verifyDepartmentAccess(String targetDepartment) {

        String userDepartment = getCurrentUserDepartment();
        if (targetDepartment != null &&
                !targetDepartment.equalsIgnoreCase("General") &&
                !userDepartment.equalsIgnoreCase(targetDepartment)) {
            throw new SecurityException(
                    String.format("Access denied: User from %s cannot access %s data",
                            userDepartment, targetDepartment));
        }
    }
}
