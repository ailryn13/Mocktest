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
 * Automatically enables the Hibernate "collegeFilter" on every @Service method.
 * This ensures that all database queries for college-aware entities (Test, Question, 
 * StudentAttempt, etc.) are automatically scoped to the authenticated user's college 
 * without needing manual filtering in every service method.
 *
 * SUPER_ADMIN: filter is NOT applied (system-wide access)
 * ADMIN, MODERATOR, STUDENT: filter IS applied, scoping all queries to their college
 */
@Aspect
@Component
public class RlsAspect {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Intercept all @Service methods and apply the college filter
     * for authenticated users (except SUPER_ADMIN).
     */
    @Around("within(@org.springframework.stereotype.Service *)")
    public Object applyCollegeFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Only apply filter for authenticated users with a college assignment
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {

            // SUPER_ADMIN has no college assignment - skip filter
            if (userDetails.isSuperAdmin()) {
                return joinPoint.proceed();
            }

            Long collegeId = userDetails.getCollegeId();
            
            // If user has a college assignment, apply college filter
            if (collegeId != null) {
                Session session = entityManager.unwrap(Session.class);

                // 1. Enable Hibernate Filter (Application-Level RLS)
                session.enableFilter("collegeFilter")
                        .setParameter("collegeId", collegeId);

                // 2. Set PostgreSQL Session Variable (Database-Level RLS)
                try {
                    entityManager.createNativeQuery("SELECT set_config('app.current_college_id', :collegeId, true)")
                            .setParameter("collegeId", collegeId.toString())
                            .getSingleResult();
                } catch (Exception e) {
                    // Proceed with Hibernate filter even if DB session variable fails
                }

                try {
                    return joinPoint.proceed();
                } finally {
                    try {
                        session.disableFilter("collegeFilter");
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        // For unauthenticated calls or users without college, proceed without filter
        return joinPoint.proceed();
    }
}
