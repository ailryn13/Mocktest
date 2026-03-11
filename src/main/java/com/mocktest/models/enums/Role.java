package com.mocktest.models.enums;

/**
 * Defines the three access-control roles used across the platform.
 * Stored as a STRING in the database column (via @Enumerated(EnumType.STRING)).
 */
public enum Role {
    SUPER_ADMIN,
    ADMIN,
    MEDIATOR,
    STUDENT
}
