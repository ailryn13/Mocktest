package com.examportal.service;

import com.examportal.entity.College;
import com.examportal.repository.CollegeRepository;
import com.examportal.repository.UserRepository;
import com.examportal.repository.TestRepository;
import com.examportal.repository.StudentAttemptRepository;
import com.examportal.security.CollegeSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for College management
 * Only SUPER_ADMIN can create, update, and manage colleges
 */
@Service
@Transactional
public class CollegeService {

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private StudentAttemptRepository studentAttemptRepository;

    @Autowired
    private CollegeSecurityService collegeSecurityService;

    /**
     * Get all colleges (SUPER_ADMIN only)
     */
    public List<College> getAllColleges() {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view all colleges");
        }
        return collegeRepository.findAll();
    }

    /**
     * Get all active colleges
     */
    public List<College> getAllActiveColleges() {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view colleges");
        }
        return collegeRepository.findByActiveTrue();
    }

    /**
     * Get college by ID
     */
    public Optional<College> getCollegeById(Long id) {
        // SUPER_ADMIN can view any college
        // Others can only view their own college
        if (!collegeSecurityService.isSuperAdmin()) {
            collegeSecurityService.verifyCollegeAccess(id);
        }
        return collegeRepository.findById(id);
    }

    /**
     * Get college by code
     */
    public Optional<College> getCollegeByCode(String code) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can search colleges by code");
        }
        return collegeRepository.findByCode(code);
    }

    /**
     * Create new college (SUPER_ADMIN only)
     */
    public College createCollege(College college) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can create colleges");
        }

        // Validate unique code
        if (college.getCode() != null && collegeRepository.existsByCode(college.getCode())) {
            throw new IllegalArgumentException("College code already exists: " + college.getCode());
        }

        // Validate unique name
        if (collegeRepository.existsByName(college.getName())) {
            throw new IllegalArgumentException("College name already exists: " + college.getName());
        }

        return collegeRepository.save(college);
    }

    /**
     * Update college (SUPER_ADMIN only)
     */
    public College updateCollege(Long id, College updatedCollege) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can update colleges");
        }

        College existing = collegeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("College not found: " + id));

        // Check code uniqueness if changed
        if (updatedCollege.getCode() != null 
                && !updatedCollege.getCode().equals(existing.getCode()) 
                && collegeRepository.existsByCode(updatedCollege.getCode())) {
            throw new IllegalArgumentException("College code already exists: " + updatedCollege.getCode());
        }

        // Check name uniqueness if changed
        if (!updatedCollege.getName().equals(existing.getName()) 
                && collegeRepository.existsByName(updatedCollege.getName())) {
            throw new IllegalArgumentException("College name already exists: " + updatedCollege.getName());
        }

        // Update fields
        existing.setName(updatedCollege.getName());
        existing.setCode(updatedCollege.getCode());
        existing.setAddress(updatedCollege.getAddress());
        existing.setCity(updatedCollege.getCity());
        existing.setState(updatedCollege.getState());
        existing.setCountry(updatedCollege.getCountry());
        existing.setContactPhone(updatedCollege.getContactPhone());
        existing.setContactEmail(updatedCollege.getContactEmail());
        existing.setDescription(updatedCollege.getDescription());
        existing.setActive(updatedCollege.getActive());

        return collegeRepository.save(existing);
    }

    /**
     * Deactivate college (SUPER_ADMIN only)
     * Soft delete - does not remove data
     */
    public College deactivateCollege(Long id) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can deactivate colleges");
        }

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("College not found: " + id));

        college.setActive(false);
        return collegeRepository.save(college);
    }

    /**
     * Activate college (SUPER_ADMIN only)
     */
    public College activateCollege(Long id) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can activate colleges");
        }

        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("College not found: " + id));

        college.setActive(true);
        return collegeRepository.save(college);
    }

    /**
     * Get total active colleges count
     */
    public long getActiveCollegesCount() {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view college statistics");
        }
        return collegeRepository.countActiveColleges();
    }

    /**
     * Get detailed statistics for a specific college
     * Returns user counts by role, test counts, and attempt counts
     * SUPER_ADMIN only
     */
    public Map<String, Object> getCollegeStatistics(Long collegeId) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view college statistics");
        }

        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new IllegalArgumentException("College not found: " + collegeId));

        Map<String, Object> stats = new HashMap<>();
        
        // College basic info
        stats.put("collegeId", college.getId());
        stats.put("collegeName", college.getName());
        stats.put("collegeCode", college.getCode());
        stats.put("active", college.getActive());

        // User statistics by role
        Map<String, Long> userStats = new HashMap<>();
        userStats.put("totalUsers", userRepository.countByCollegeId(collegeId));
        userStats.put("students", (long) userRepository.findByRoleNameAndCollegeId("STUDENT", collegeId).size());
        userStats.put("moderators", (long) userRepository.findByRoleNameAndCollegeId("MODERATOR", collegeId).size());
        userStats.put("admins", (long) userRepository.findByRoleNameAndCollegeId("ADMIN", collegeId).size());
        stats.put("users", userStats);

        // Test statistics
        Map<String, Long> testStats = new HashMap<>();
        testStats.put("totalTests", testRepository.countByCollegeId(collegeId));
        stats.put("tests", testStats);

        // Attempt statistics
        Map<String, Long> attemptStats = new HashMap<>();
        attemptStats.put("totalAttempts", studentAttemptRepository.countByCollegeId(collegeId));
        stats.put("attempts", attemptStats);

        return stats;
    }

    /**
     * Get user counts by role for a specific college
     * SUPER_ADMIN only
     */
    public Map<String, Long> getUserCountsByRole(Long collegeId) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view college user statistics");
        }

        if (!collegeRepository.existsById(collegeId)) {
            throw new IllegalArgumentException("College not found: " + collegeId);
        }

        Map<String, Long> counts = new HashMap<>();
        counts.put("totalUsers", userRepository.countByCollegeId(collegeId));
        counts.put("students", (long) userRepository.findByRoleNameAndCollegeId("STUDENT", collegeId).size());
        counts.put("moderators", (long) userRepository.findByRoleNameAndCollegeId("MODERATOR", collegeId).size());
        counts.put("admins", (long) userRepository.findByRoleNameAndCollegeId("ADMIN", collegeId).size());
        
        return counts;
    }

    /**
     * Get all colleges with their basic statistics
     * SUPER_ADMIN only
     */
    public List<Map<String, Object>> getAllCollegesWithStats() {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view all college statistics");
        }

        List<College> colleges = collegeRepository.findAll();
        return colleges.stream().map(college -> {
            Map<String, Object> collegeData = new HashMap<>();
            collegeData.put("id", college.getId());
            collegeData.put("name", college.getName());
            collegeData.put("code", college.getCode());
            collegeData.put("city", college.getCity());
            collegeData.put("state", college.getState());
            collegeData.put("active", college.getActive());
            collegeData.put("contactEmail", college.getContactEmail());
            
            // Add user counts
            Map<String, Long> userCounts = new HashMap<>();
            userCounts.put("totalUsers", userRepository.countByCollegeId(college.getId()));
            userCounts.put("students", (long) userRepository.findByRoleNameAndCollegeId("STUDENT", college.getId()).size());
            userCounts.put("moderators", (long) userRepository.findByRoleNameAndCollegeId("MODERATOR", college.getId()).size());
            userCounts.put("admins", (long) userRepository.findByRoleNameAndCollegeId("ADMIN", college.getId()).size());
            collegeData.put("userCounts", userCounts);
            
            // Add test count
            collegeData.put("testCount", testRepository.countByCollegeId(college.getId()));
            
            return collegeData;
        }).toList();
    }
}
