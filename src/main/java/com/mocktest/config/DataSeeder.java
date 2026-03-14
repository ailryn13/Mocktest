package com.mocktest.config;

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

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;

/**
 * Seeds default ADMIN and SUPER_ADMIN users on first startup.
 *
 * <p>Credentials are configurable via application.properties:</p>
 * <pre>
 *   app.admin.email / app.admin.password / app.admin.name
 *   app.superadmin.email / app.superadmin.password / app.superadmin.name
 * </pre>
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSource dataSource;

    @Value("${app.admin.email:admin@mocktest.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.name:Admin}")
    private String adminName;

    @Value("${app.superadmin.email:superadmin@mocktest.app}")
    private String superAdminEmail;

    @Value("${app.superadmin.password:SuperAdmin@123456}")
    private String superAdminPassword;

    @Value("${app.superadmin.name:Super Admin}")
    private String superAdminName;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      DataSource dataSource) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        log.info("Running Flyway migrations manually after Hibernate schema generation...");
        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .locations("classpath:db/migration")
                .load()
                .migrate();

        seedUser(adminEmail, adminPassword, adminName, Role.ADMIN);
        seedUser(superAdminEmail, superAdminPassword, superAdminName, Role.SUPER_ADMIN);
    }

    /**
     * Seeds or normalizes a user with the given role.
     */
    private void seedUser(String email, String password, String name, Role role) {
        var existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            boolean updated = false;

            if (user.getRole() != role) {
                user.setRole(role);
                updated = true;
            }

            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(password));
                updated = true;
            }

            if (!name.equals(user.getName())) {
                user.setName(name);
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
                log.info("{} user '{}' found and normalized.", role, email);
            } else {
                log.info("{} user '{}' already exists and is valid.", role, email);
            }
            return;
        }

        User user = new User(
                name,
                email,
                passwordEncoder.encode(password),
                role,
                null   // no department (system-level user)
        );

        userRepository.save(user);
        log.info("Default {} user created: {} / {}", role, email, password);
    }

}
