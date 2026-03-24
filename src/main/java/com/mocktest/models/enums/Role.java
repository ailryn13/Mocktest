package com.mocktest.models.enums;

/**
 * Defines the access-control roles used across the platform.
 * Stored as a STRING in the database column (via @Enumerated(EnumType.STRING)).
 *
 * <ul>
 *   <li>ADMIN – full access to one specific college/institution</li>
 *   <li>MEDIATOR – can create exams, monitor students (department-restricted)</li>
 *   <li>STUDENT – can take exams, view own submissions (department-restricted)</li>
 *   <li>SUPER_ADMIN – system-wide access, can manage all colleges and bypass RLS</li>
 * </ul>
 */
public enum Role {
    ADMIN,
    MEDIATOR,
    MODERATOR,
    STUDENT,
    SUPER_ADMIN;

    public boolean isMediator() {
        return this == MEDIATOR || this == MODERATOR;
    }
}
