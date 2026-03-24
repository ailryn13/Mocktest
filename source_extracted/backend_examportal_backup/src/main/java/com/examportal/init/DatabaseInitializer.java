package com.examportal.init;

import com.examportal.entity.Role;
import com.examportal.entity.User;
import com.examportal.entity.UserRole;
import com.examportal.entity.Test;
import com.examportal.entity.StudentAttempt;
import com.examportal.repository.RoleRepository;
import com.examportal.repository.UserRepository;
import com.examportal.repository.StudentAttemptRepository;
import com.examportal.repository.TestRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Database Initializer
 * 
 * Seeds initial roles and admin user on application startup
 * Only runs if roles don't exist (idempotent)
 */
@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DatabaseInitializer.class);
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentAttemptRepository attemptRepository;
    private final TestRepository testRepository;

    public DatabaseInitializer(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            StudentAttemptRepository attemptRepository,
            TestRepository testRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.attemptRepository = attemptRepository;
        this.testRepository = testRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // cleanupLegacyRoles(); // Disabled - ADMIN role is now used
        initializeRoles();
        initializeSuperAdminUser();
        initializeModeratorUser();
        initializeTestStudent();
        resetSampleTests();
        log.info("Database initialization complete!");
    }

    private void initializeSuperAdminUser() {
        String superAdminEmail = "superadmin@mocktest.app";

        Role superAdminRole = roleRepository.findByName(Role.SUPER_ADMIN)
                .orElseThrow(() -> new RuntimeException("SUPER_ADMIN role not found"));

        User superAdmin = userRepository.findByEmail(superAdminEmail).orElse(null);

        if (superAdmin == null) {
            superAdmin = new User();
            superAdmin.setUsername("superadmin");
            superAdmin.setEmail(superAdminEmail);
            superAdmin.setPassword(passwordEncoder.encode("SuperAdmin@123456"));
            superAdmin.setFirstName("Super");
            superAdmin.setLastName("Admin");
            superAdmin.setDepartment("System");
            superAdmin.setEnabled(true);
            superAdmin.setCollege(null); // SUPER_ADMIN has no college

            UserRole userRole = new UserRole();
            userRole.setUser(superAdmin);
            userRole.setRole(superAdminRole);
            superAdmin.getUserRoles().add(userRole);

            userRepository.save(superAdmin);
            log.info("Created SUPER_ADMIN user - Email: {}, Password: SuperAdmin@123456", superAdminEmail);
        } else {
            log.info("SUPER_ADMIN user already exists: {}", superAdminEmail);
        }
    }

    private void cleanupLegacyRoles() {
        roleRepository.findByName("ADMIN").ifPresent(role -> {
            log.info("Cleaning up legacy ADMIN role and associated user mappings...");
            // Force delete mappings for this role
            userRepository.findByEmail("admin@examportal.com").ifPresent(adminUser -> {
                log.info("Deleting legacy admin user...");
                userRepository.delete(adminUser);
            });

            // Also ensure no other users are orphaned
            log.info("Deleting ADMIN role...");
            roleRepository.delete(role);
        });
    }

    private void initializeRoles() {
        // Create STUDENT role
        if (roleRepository.findByName(Role.STUDENT).isEmpty()) {
            Role studentRole = new Role();
            studentRole.setName(Role.STUDENT);
            studentRole.setDescription("Student role - can take exams and view own submissions");
            roleRepository.save(studentRole);
            log.info("Created STUDENT role");
        }

        // Create MODERATOR role
        if (roleRepository.findByName(Role.MODERATOR).isEmpty()) {
            Role moderatorRole = new Role();
            moderatorRole.setName(Role.MODERATOR);
            moderatorRole.setDescription("Moderator role - can create and monitor exams (department-restricted)");
            roleRepository.save(moderatorRole);
            log.info("Created MODERATOR role");
        }

        // Create ADMIN role
        if (roleRepository.findByName(Role.ADMIN).isEmpty()) {
            Role adminRole = new Role();
            adminRole.setName(Role.ADMIN);
            adminRole.setDescription("College Admin - can manage exams and users within their assigned college");
            roleRepository.save(adminRole);
            log.info("Created ADMIN role");
        }

        // Create SUPER_ADMIN role
        if (roleRepository.findByName(Role.SUPER_ADMIN).isEmpty()) {
            Role superAdminRole = new Role();
            superAdminRole.setName(Role.SUPER_ADMIN);
            superAdminRole.setDescription("Super Admin - system-wide access, can manage colleges and assign admins");
            roleRepository.save(superAdminRole);
            log.info("Created SUPER_ADMIN role");
        }

    }

    private void initializeModeratorUser() {
        String modEmail = "moderator@examportal.com";
        Role modRole = roleRepository.findByName(Role.MODERATOR)
                .orElseThrow(() -> new RuntimeException("Moderator role not found"));

        User moderator = userRepository.findByEmail(modEmail).orElse(new User());

        boolean isNew = moderator.getId() == null;

        moderator.setUsername("moderator");
        moderator.setEmail(modEmail);
        if (isNew) {
            moderator.setPassword(passwordEncoder.encode("moderator123"));
        }
        moderator.setFirstName("Test");
        moderator.setLastName("Moderator");
        moderator.setDepartment("CSE");
        moderator.setProfile("MODERATOR");
        moderator.setEnabled(true);

        // Force reset roles to ensure correct authority
        moderator.getUserRoles().clear();
        UserRole userRole = new UserRole();
        userRole.setUser(moderator);
        userRole.setRole(modRole);
        moderator.getUserRoles().add(userRole);

        userRepository.save(moderator);
        log.info("{} test moderator - Email: {}", isNew ? "Created" : "Updated/Synced", modEmail);
    }

    private void initializeTestStudent() {
        String studentEmail = "student@examportal.com";

        if (userRepository.findByEmail(studentEmail).isEmpty()) {
            Role studentRole = roleRepository.findByName(Role.STUDENT)
                    .orElseThrow(() -> new RuntimeException("Student role not found"));

            User student = new User();
            student.setUsername("student");
            student.setEmail(studentEmail);
            student.setPassword(passwordEncoder.encode("student123"));
            student.setFirstName("Test");
            student.setLastName("Student");
            student.setDepartment("CSE");
            student.setProfile("STUDENT");
            student.setEnabled(true);

            // Create UserRole association
            UserRole userRole = new UserRole();
            userRole.setUser(student);
            userRole.setRole(studentRole);
            student.getUserRoles().add(userRole);

            userRepository.save(student);
            log.info("Created test student - Email: {}, Password: student123", studentEmail);
        }
    }

    private void resetSampleTests() {
        log.info("Checking for sample tests to unlock...");
        try {
            java.util.List<Long> sampleTestIds = testRepository.findAll().stream()
                    .filter(test -> test.getTitle().toLowerCase().contains("sample"))
                    .map(Test::getId)
                    .collect(java.util.stream.Collectors.toList());

            if (!sampleTestIds.isEmpty()) {
                log.warn("Found {} sample tests. Clearing all existing attempts to unlock.", sampleTestIds.size());
                for (Long testId : sampleTestIds) {
                    java.util.List<StudentAttempt> attempts = attemptRepository
                            .findByTestId(testId);
                    if (!attempts.isEmpty()) {
                        attemptRepository.deleteAll(attempts);
                        log.info("Deleted {} attempts for sample test ID: {}", attempts.size(), testId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to reset sample tests: {}", e.getMessage());
        }
    }
}
