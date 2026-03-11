package com.examportal.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Department Entity
 * Represents organizational departments within a college
 */
@Entity
@Table(name = "departments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"college_id", "name"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", nullable = false)
    private College college;

    @Builder.Default
    private boolean active = true;
}
