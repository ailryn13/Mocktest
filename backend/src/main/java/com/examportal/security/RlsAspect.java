package com.examportal.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Global Row-Level Security Aspect
 *
 * Automatically enables the Hibernate "departmentFilter" on every
 * 
 * @Service method. This ensures that all database queries for
 *          department-aware entities (Test, Question) are automatically
 *          scoped to the authenticated user's department without needing
 *          manual filtering in every service method.
 *
 *          STUDENTS: filter is NOT applied (they see cross-dept content by
 *          design via student-specific queries)
 *          MODERATORS: filter IS applied, scoping all queries to their
 *          department.
 */
@Aspect
@Component
public class RlsAspect {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Intercept all @Service methods and apply the department filter
     * for authenticated MODERATOR users.
     */
    @Around("within(@org.springframework.stereotype.Service *)")
    public Object applyDepartmentFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Only apply filter for authenticated MODERATOR users
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof CustomUserDetails userDetails
                && userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("MODERATOR"))) {

            Session session = entityManager.unwrap(Session.class);
            String department = userDetails.getDepartment();

            // 1. Enable Hibernate Filter (Global Application-Level RLS)
            session.enableFilter("departmentFilter")
                    .setParameter("dept", department);

            // 2. Set PostgreSQL Session Variable (Database-Level RLS)
            // This allows native SQL policies to see the current department
            session.doWork(connection -> {
                try (var statement = connection.prepareStatement(
                        "SET LOCAL app.current_department = ?")) {
                    statement.setString(1, department);
                    statement.execute();
                }
            });

            try {
                return joinPoint.proceed();
            } finally {
                // Always disable the filter after the method completes
                try {
                    session.disableFilter("departmentFilter");
                    // 'SET LOCAL' automatically resets at the end of the transaction,
                    // but we ensure session hygiene here if needed.
                } catch (Exception ignored) {
                }
            }
        }

        // For STUDENT users or unauthenticated calls, proceed without filter
        return joinPoint.proceed();
    }
}
