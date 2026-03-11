package com.mocktest.config;

import com.mocktest.models.Department;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds a default ADMIN user on first startup so that mediators
 * and students can subsequently be onboarded via the admin endpoints.
 *
 * <p>Credentials are configurable via application.properties:</p>
 * <pre>
 *   app.admin.email=superadmin@mocktest.app
 *   app.admin.password=SuperAdmin@123456
 *   app.admin.name=SuperAdmin
 * </pre>
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final List<String> DEFAULT_DEPARTMENTS = List.of(
            "Computer Science and Engineering",
            "Electronics and Communication Engineering",
            "Mechanical Engineering",
            "Civil Engineering",
            "Electrical and Electronics Engineering",
            "Information Technology"
    );

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:superadmin@mocktest.app}")
    private String adminEmail;

    @Value("${app.admin.password:SuperAdmin@123456}")
    private String adminPassword;

    @Value("${app.admin.name:SuperAdmin}")
    private String adminName;

    public DataSeeder(UserRepository userRepository,
                      DepartmentRepository departmentRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedDepartments();
        var existingUser = userRepository.findByEmail(adminEmail);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean updated = false;

            if (user.getRole() != Role.SUPER_ADMIN) {
                user.setRole(Role.SUPER_ADMIN);
                updated = true;
            }

            if (!passwordEncoder.matches(adminPassword, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(adminPassword));
                updated = true;
            }

            if (!adminName.equals(user.getName())) {
                user.setName(adminName);
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
                log.info("Admin user '{}' found and normalized to ADMIN credentials.", adminEmail);
            } else {
                log.info("Admin user '{}' already exists and is valid.", adminEmail);
            }
            return;
        }

        User admin = new User(
                adminName,
                adminEmail,
                passwordEncoder.encode(adminPassword),
                Role.SUPER_ADMIN,
                null   // admin has no department
        );

        userRepository.save(admin);
        log.info("Default SUPER_ADMIN user created: {} / {}", adminEmail, adminPassword);
    }

    private void seedDepartments() {
        for (String name : DEFAULT_DEPARTMENTS) {
            if (departmentRepository.findByName(name).isEmpty()) {
                departmentRepository.save(new Department(name));
                log.info("Seeded department: {}", name);
            }
        }
    }
}
