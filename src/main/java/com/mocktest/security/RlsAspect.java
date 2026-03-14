package com.mocktest.security;

import com.mocktest.models.User;
import com.mocktest.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Global Row-Level Security Aspect
 *
 * <p>Automatically enables the Hibernate "departmentFilter" on every @Service method.
 * This ensures that all database queries for department-aware entities (User, Exam,
 * Question, Submission, MalpracticeLog) are automatically scoped to the authenticated
 * user's department without needing manual filtering in every service method.</p>
 *
 * <ul>
 *   <li><b>SUPER_ADMIN</b>: filter is NOT applied (system-wide access across all departments)</li>
 *   <li><b>ADMIN, MEDIATOR, STUDENT</b>: filter IS applied, scoping queries to their department</li>
 * </ul>
 *
 * <p>Additionally sets the PostgreSQL session variable {@code app.current_department_id}
 * for database-level RLS policies, and {@code app.current_role} for the SUPER_ADMIN
 * bypass in those policies.</p>
 */
@Aspect
@Component
public class RlsAspect {

    private static final Logger log = LoggerFactory.getLogger(RlsAspect.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;

    public RlsAspect(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Intercept all @Service methods and apply the department filter
     * for authenticated users (except SUPER_ADMIN).
     */
    @Around("within(@org.springframework.stereotype.Service *)")
    public Object applyDepartmentFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Only apply filter for authenticated users
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserDetails userDetails) {

            // Check if SUPER_ADMIN — bypass all filters
            boolean isSuperAdmin = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch("ROLE_SUPER_ADMIN"::equals);

            if (isSuperAdmin) {
                log.debug("[RLS] SUPER_ADMIN detected — skipping department filter");

                // Set the session variable so PostgreSQL RLS policies also grant full access
                try {
                    entityManager.createNativeQuery(
                            "SELECT set_config('app.current_role', 'SUPER_ADMIN', true)")
                            .getSingleResult();
                } catch (Exception e) {
                    log.warn("[RLS] Failed to set app.current_role for SUPER_ADMIN: {}", e.getMessage());
                }

                return joinPoint.proceed();
            }

            // --- Non-SUPER_ADMIN: look up department from DB ---
            String email = userDetails.getUsername();
            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null && user.getDepartment() != null) {
                Long departmentId = user.getDepartment().getId();

                Session session = entityManager.unwrap(Session.class);

                // 1. Enable Hibernate Filter (Application-Level RLS)
                session.enableFilter("departmentFilter")
                        .setParameter("departmentId", departmentId);

                log.debug("[RLS] Enabled departmentFilter for department_id={} user={}",
                        departmentId, email);

                // 2. Set PostgreSQL Session Variables (Database-Level RLS)
                try {
                    entityManager.createNativeQuery(
                            "SELECT set_config('app.current_department_id', :deptId, true)")
                            .setParameter("deptId", departmentId.toString())
                            .getSingleResult();
                    entityManager.createNativeQuery(
                            "SELECT set_config('app.current_role', :role, true)")
                            .setParameter("role", user.getRole().name())
                            .getSingleResult();
                } catch (Exception e) {
                    log.warn("[RLS] Failed to set PostgreSQL session variables: {}", e.getMessage());
                    // Proceed with Hibernate filter even if DB session variable fails
                }

                try {
                    return joinPoint.proceed();
                } finally {
                    try {
                        session.disableFilter("departmentFilter");
                    } catch (Exception ignored) {
                        // Filter may already be disabled
                    }
                }
            }
        }

        // For unauthenticated calls or users without a department, proceed without filter
        return joinPoint.proceed();
    }
}
