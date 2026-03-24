package com.examportal.repository;

import com.examportal.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for College entity operations
 */
@Repository
public interface CollegeRepository extends JpaRepository<College, Long> {

    /**
     * Find college by unique code
     */
    Optional<College> findByCode(String code);

    /**
     * Find college by name
     */
    Optional<College> findByName(String name);

    /**
     * Find all active colleges
     */
    List<College> findByActiveTrue();

    /**
     * Find all inactive colleges
     */
    List<College> findByActiveFalse();

    /**
     * Check if college code exists
     */
    boolean existsByCode(String code);

    /**
     * Check if college name exists
     */
    boolean existsByName(String name);

    /**
     * Count total active colleges
     */
    @Query("SELECT COUNT(c) FROM College c WHERE c.active = true")
    long countActiveColleges();
}
