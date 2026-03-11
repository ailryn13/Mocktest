package com.mocktest.repositories;

import com.mocktest.models.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /** Find a department by its unique name. */
    Optional<Department> findByName(String name);
}
