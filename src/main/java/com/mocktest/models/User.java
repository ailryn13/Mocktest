package com.mocktest.models;

import com.mocktest.models.enums.Role;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

/**
 * Represents every person who can log in – Admin, Mediator, Student, or Super Admin.
 *
 * <p>Mapped to the <b>users</b> table in PostgreSQL.
 * The {@code department_id} column is a foreign key to {@link Department}.</p>
 */
@Entity
@Table(name = "users")
@FilterDef(name = "departmentFilter", parameters = @ParamDef(name = "departmentId", type = Long.class))
@Filter(name = "departmentFilter", condition = "department_id = :departmentId")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "register_number", unique = true)
    private String registerNumber;

    /**
     * Stored as a VARCHAR in PostgreSQL (e.g. "ADMIN", "MEDIATOR", "STUDENT")
     * thanks to {@code EnumType.STRING}.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * Many users can belong to one department.
     * Maps to the {@code department_id} FK column.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    /* ---------- Constructors ---------- */

    public User() {
        // Required by JPA
    }

    public User(String name, String email, String passwordHash, Role role, Department department) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.department = department;
    }

    /* ---------- Getters & Setters ---------- */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getRegisterNumber() {
        return registerNumber;
    }

    public void setRegisterNumber(String registerNumber) {
        this.registerNumber = registerNumber;
    }
}
