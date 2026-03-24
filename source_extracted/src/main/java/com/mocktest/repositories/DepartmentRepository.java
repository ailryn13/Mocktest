package com.mocktest.repositories;

import com.mocktest.models.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /** Find sub-departments of a college. */
    java.util.List<Department> findByParentId(Long parentId);

    /** Find top-level colleges (no parent). */
    java.util.List<Department> findByParentIsNull();

    /** Find a department by its unique name. */
    Optional<Department> findByName(String name);
}
