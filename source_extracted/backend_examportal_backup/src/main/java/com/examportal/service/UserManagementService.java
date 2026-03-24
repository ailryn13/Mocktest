package com.examportal.service;

import com.examportal.dto.CreateAdminRequest;
import com.examportal.dto.RegisterModeratorRequest;
import com.examportal.entity.College;
import com.examportal.entity.Department;
import com.examportal.entity.Role;
import com.examportal.entity.User;
import com.examportal.entity.UserRole;
import com.examportal.repository.CollegeRepository;
import com.examportal.repository.DepartmentRepository;
import com.examportal.repository.RoleRepository;
import com.examportal.repository.UserRepository;
import com.examportal.security.CollegeSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

/**
 * User Management Service
 * Handles user creation, assignment to colleges, and role management
 */
@Service
@Transactional
public class UserManagementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CollegeSecurityService collegeSecurityService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Create ADMIN user and assign to college (SUPER_ADMIN only)
     */
    public User createAdminForCollege(CreateAdminRequest request) {
        // Only SUPER_ADMIN can create ADMIN users
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can create ADMIN users");
        }

        // Validate college exists
        College college = collegeRepository.findById(request.getCollegeId())
                .orElseThrow(() -> new IllegalArgumentException("College not found: " + request.getCollegeId()));

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .college(college)
                .department(request.getDepartment())
                .enabled(request.getEnabled())
                .userRoles(new HashSet<>())
                .build();

        // Assign ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found in database"));

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(adminRole);

        user.getUserRoles().add(userRole);

        // Save user
        return userRepository.save(user);
    }

    /**
     * Get all users for a specific college (SUPER_ADMIN only)
     */
    public List<User> getUsersByCollege(Long collegeId) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view college users");
        }

        if (!collegeRepository.existsById(collegeId)) {
            throw new IllegalArgumentException("College not found: " + collegeId);
        }

        return userRepository.findByCollegeId(collegeId);
    }

    /**
     * Get users by role and college (SUPER_ADMIN only)
     */
    public List<User> getUsersByRoleAndCollege(String roleName, Long collegeId) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can view college users");
        }

        if (!collegeRepository.existsById(collegeId)) {
            throw new IllegalArgumentException("College not found: " + collegeId);
        }

        return userRepository.findByRoleNameAndCollegeId(roleName, collegeId);
    }

    /**
     * Remove user from college (SUPER_ADMIN only)
     * Soft delete - deactivates user
     */
    public User deactivateUser(Long userId) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can deactivate users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setEnabled(false);
        return userRepository.save(user);
    }

    /**
     * Activate user (SUPER_ADMIN only)
     */
    public User activateUser(Long userId) {
        if (!collegeSecurityService.isSuperAdmin()) {
            throw new SecurityException("Only SUPER_ADMIN can activate users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setEnabled(true);
        return userRepository.save(user);
    }

    /**
     * Create MODERATOR user and assign to admin's college (ADMIN only)
     */
    public User createModeratorForCollege(Long collegeId, RegisterModeratorRequest request) {
        // Validate college exists
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new IllegalArgumentException("College not found: " + collegeId));

        // Validate department exists and belongs to the college
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + request.getDepartmentId()));

        if (!department.getCollege().getId().equals(collegeId)) {
            throw new IllegalArgumentException("Department does not belong to your college");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Split name into first and last name
        String[] nameParts = request.getName().split(" ", 2);
        String firstName = nameParts.length > 0 ? nameParts[0] : "";
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        // Create user
        User user = User.builder()
                .username(request.getEmail().split("@")[0])
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(firstName)
                .lastName(lastName)
                .email(request.getEmail())
                .college(college)
                .department(department.getName())
                .enabled(true)
                .userRoles(new HashSet<>())
                .build();

        // Assign MODERATOR role
        Role moderatorRole = roleRepository.findByName("MODERATOR")
                .orElseThrow(() -> new IllegalStateException("MODERATOR role not found in database"));

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(moderatorRole);

        user.getUserRoles().add(userRole);

        // Save user
        return userRepository.save(user);
    }
}
