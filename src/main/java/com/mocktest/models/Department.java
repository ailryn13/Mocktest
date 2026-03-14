package com.mocktest.models;

import jakarta.persistence.*;

/**
 * Represents an organisational department.
 * Both Mediators and Students belong to exactly one department.
 *
 * <p>Mapped to the <b>departments</b> table in PostgreSQL.</p>
 */
@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column
    private String address;

    @Column(unique = true)
    private String code;

    /* ---------- Constructors ---------- */

    public Department() {
        // Required by JPA
    }

    public Department(String name) {
        this.name = name;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
