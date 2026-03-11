package com.examportal.security;

import com.examportal.entity.College;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * College Security Service
 * 
 * Provides row-level security by filtering queries based on user's college
 * Ensures College A users cannot see College B data
 * SUPER_ADMIN has system-wide access and bypass all filters
 * 
 * Usage:
 * Long collegeId = collegeSecurityService.getCurrentUserCollegeId();
 * testRepository.findByCollegeId(collegeId);
 */
@Service
public class CollegeSecurityService {

    public CollegeSecurityService() {
    }

    /**
     * Get current authenticated user details
     */
    private CustomUserDetails getCurrentUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails;
        }

        throw new IllegalStateException("No authenticated user found");
    }

    /**
     * Get current authenticated user's college ID
     * Returns null for SUPER_ADMIN (system-wide access)
     */
    public Long getCurrentUserCollegeId() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        
        // SUPER_ADMIN has no college assignment
        if (userDetails.isSuperAdmin()) {
            return null;
        }
        
        return userDetails.getCollegeId();
    }

    /**
     * Get current authenticated user's department
     */
    public String getCurrentUserDepartment() {
        return getCurrentUserDetails().getDepartment();
    }

    /**
     * Get current authenticated user's ID
     */
    public Long getCurrentUserId() {
        return getCurrentUserDetails().getId();
    }

    /**
     * Check if current user is SUPER_ADMIN
     */
    public boolean isSuperAdmin() {
        return getCurrentUserDetails().isSuperAdmin();
    }

    /**
     * Check if current user is ADMIN
     */
    public boolean isAdmin() {
        return getCurrentUserDetails().isAdmin();
    }

    /**
     * Check if current user is MODERATOR
     */
    public boolean isModerator() {
        return getCurrentUserDetails().isModerator();
    }

    /**
     * Check if current user is STUDENT
     */
    public boolean isStudent() {
        return getCurrentUserDetails().isStudent();
    }

    /**
     * Get college filter specification
     * SUPER_ADMIN bypasses this filter
     */
    public <T> Specification<T> hasCollegeAccess(String collegeField) {
        return (root, query, criteriaBuilder) -> {
            if (isSuperAdmin()) {
                // SUPER_ADMIN sees all records
                return criteriaBuilder.conjunction();
            }
            
            Long userCollegeId = getCurrentUserCollegeId();
            if (userCollegeId == null) {
                // User has no college assignment - deny access
                return criteriaBuilder.disjunction();
            }
            
            return criteriaBuilder.equal(root.get(collegeField).get("id"), userCollegeId);
        };
    }

    /**
     * Verify user has access to specific college
     * Throws exception if access denied
     * SUPER_ADMIN bypasses this check
     */
    public void verifyCollegeAccess(Long targetCollegeId) {
        if (isSuperAdmin()) {
            return; // SUPER_ADMIN has access to all colleges
        }

        Long userCollegeId = getCurrentUserCollegeId();
        
        if (userCollegeId == null) {
            throw new SecurityException("User has no college assignment");
        }
        
        if (targetCollegeId != null && !userCollegeId.equals(targetCollegeId)) {
            throw new SecurityException(
                    String.format("Access denied: User from college %d cannot access college %d data",
                            userCollegeId, targetCollegeId));
        }
    }

    /**
     * Verify user has access to college entity
     */
    public void verifyCollegeAccess(College college) {
        if (college != null) {
            verifyCollegeAccess(college.getId());
        }
    }

    /**
     * Check if user has access to specific college (without throwing exception)
     */
    public boolean hasCollegeAccess(Long targetCollegeId) {
        if (isSuperAdmin()) {
            return true;
        }

        Long userCollegeId = getCurrentUserCollegeId();
        return userCollegeId != null && userCollegeId.equals(targetCollegeId);
    }
}
