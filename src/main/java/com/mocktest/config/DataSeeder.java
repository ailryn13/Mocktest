package com.mocktest.config;

import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default ADMIN user on first startup so that mediators
 * and students can subsequently be onboarded via the admin endpoints.
 *
 * <p>Credentials are configurable via application.properties:</p>
 * <pre>
 *   app.admin.email=admin@mocktest.com
 *   app.admin.password=admin123
 *   app.admin.name=Admin
 * </pre>
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@mocktest.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.name:Admin}")
    private String adminName;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        var existingUser = userRepository.findByEmail(adminEmail);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean updated = false;

            if (user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
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
                Role.ADMIN,
                null   // admin has no department
        );

        userRepository.save(admin);
        log.info("Default ADMIN user created: {} / {}", adminEmail, adminPassword);
    }
}
