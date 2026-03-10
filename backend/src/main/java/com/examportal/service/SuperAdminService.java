package com.examportal.service;

import com.examportal.dto.CollegeResponse;
import com.examportal.dto.CreateCollegeRequest;
import com.examportal.entity.College;
import com.examportal.entity.Role;
import com.examportal.entity.User;
import com.examportal.entity.UserRole;
import com.examportal.repository.CollegeRepository;
import com.examportal.repository.RoleRepository;
import com.examportal.repository.UserRepository;
import com.examportal.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    /**
     * Get all colleges
     */
    public List<CollegeResponse> getAllColleges() {
        log.info("Fetching all colleges");
        
        return collegeRepository.findAll().stream()
                .map(college -> {
                    // Find the admin user for this college
                    List<User> admins = userRepository.findByRoleNameAndCollegeId("ADMIN", college.getId());
                    
                    String adminEmail = null;
                    String adminName = null;
                    
                    if (!admins.isEmpty()) {
                        User admin = admins.get(0); // Get first admin
                        adminEmail = admin.getEmail();
                        adminName = (admin.getFirstName() != null ? admin.getFirstName() : "") + 
                                   (admin.getLastName() != null ? " " + admin.getLastName() : "");
                        adminName = adminName.trim().isEmpty() ? admin.getEmail() : adminName.trim();
                    }
                    
                    return CollegeResponse.fromEntity(college, adminEmail, adminName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Create a new college and assign admin (optional)
     */
    @Transactional
    public CollegeResponse createCollege(CreateCollegeRequest request) {
        log.info("Creating college: {} with code: {}", request.getName(), request.getCode());

        // Validation: Check if code already exists
        if (collegeRepository.existsByCode(request.getCode().toUpperCase())) {
            throw new IllegalArgumentException("College code already exists: " + request.getCode());
        }

        // Validation: Check if name already exists
        if (collegeRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("College name already exists: " + request.getName());
        }

        // Create college
        College college = new College();
        college.setName(request.getName());
        college.setCode(request.getCode().toUpperCase());
        college.setAddress(request.getLocation());
        college.setActive(true);

        college = collegeRepository.save(college);
        log.info("College created with ID: {}", college.getId());

        String adminEmail = null;
        String adminName = null;

        // Assign admin to college if provided
        if (request.getAdminEmail() != null && !request.getAdminEmail().trim().isEmpty()) {
            User adminUser = userRepository.findByEmail(request.getAdminEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Admin user not found with email: " + request.getAdminEmail()));

            // Check if user already has a college assigned
            if (adminUser.getCollege() != null) {
                throw new IllegalArgumentException("User is already assigned to college: " + adminUser.getCollege().getName());
            }

            // Assign admin to college
            adminUser.setCollege(college);
            userRepository.save(adminUser);

            // Assign ADMIN role if not already assigned
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new IllegalArgumentException("ADMIN role not found in database"));

            boolean hasAdminRole = adminUser.getUserRoles().stream()
                    .anyMatch(ur -> ur.getRole().getName().equals("ADMIN"));

            if (!hasAdminRole) {
                UserRole userRole = new UserRole();
                userRole.setUser(adminUser);
                userRole.setRole(adminRole);
                userRoleRepository.save(userRole);
                log.info("Assigned ADMIN role to user: {}", adminUser.getEmail());
            }

            adminEmail = adminUser.getEmail();
            adminName = (adminUser.getFirstName() != null ? adminUser.getFirstName() : "") + 
                      (adminUser.getLastName() != null ? " " + adminUser.getLastName() : "");
            adminName = adminName.trim().isEmpty() ? adminUser.getEmail() : adminName.trim();

            log.info("Successfully created college and assigned admin: {}", adminEmail);
        } else {
            log.info("College created without admin assignment");
        }

        return CollegeResponse.fromEntity(college, adminEmail, adminName);
    }

    /**
     * Delete a college
     */
    @Transactional
    public void deleteCollege(Long collegeId) {
        log.info("Deleting college ID: {}", collegeId);

        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new IllegalArgumentException("College not found with ID: " + collegeId));

        // Check if there are any users associated with this college
        long userCount = userRepository.countByCollegeId(collegeId);
        if (userCount > 0) {
            throw new IllegalArgumentException("Cannot delete college with " + userCount + " associated users. Please reassign or delete users first.");
        }

        collegeRepository.delete(college);
        log.info("College deleted successfully");
    }
}
