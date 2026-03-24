package com.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = { "userRoles" })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    // Legacy column used by older migrations/deployments.
    @Column(name = "password_hash")
    private String passwordHash;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    // College-level association (for multi-college isolation)
    // SUPER_ADMIN users will have collegeId = null (system-wide access)
    // ADMIN, MODERATOR, STUDENT users must belong to a specific college
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id")
    private College college;

    // Department within college (e.g., CSE, ECE, MECH)
    // Used for department-level restrictions within a college
    private String department;

    @Builder.Default
    private boolean enabled = true;
    private String profile;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, mappedBy = "user")
    @JsonIgnore
    @Builder.Default
    private Set<UserRole> userRoles = new HashSet<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        syncPasswordColumns();
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        syncPasswordColumns();
        updatedAt = LocalDateTime.now();
    }

    /**
     * Keep both password columns aligned across old/new schemas.
     */
    private void syncPasswordColumns() {
        if ((password == null || password.isBlank()) && passwordHash != null && !passwordHash.isBlank()) {
            password = passwordHash;
        }
        if ((passwordHash == null || passwordHash.isBlank()) && password != null && !password.isBlank()) {
            passwordHash = password;
        }
    }

    // NO manual getters or setters here (Lombok handles them)
}
