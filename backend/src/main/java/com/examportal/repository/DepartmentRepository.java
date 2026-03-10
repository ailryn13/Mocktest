package com.examportal.repository;

import com.examportal.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    List<Department> findByCollegeId(Long collegeId);
    
    Optional<Department> findByNameAndCollegeId(String name, Long collegeId);
    
    boolean existsByNameAndCollegeId(String name, Long collegeId);
}
