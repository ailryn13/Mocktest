package com.examportal.service;

import com.examportal.dto.DepartmentRequest;
import com.examportal.dto.DepartmentResponse;
import com.examportal.entity.College;
import com.examportal.entity.Department;
import com.examportal.repository.CollegeRepository;
import com.examportal.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CollegeRepository collegeRepository;

    /**
     * Get all departments for a specific college
     */
    public List<DepartmentResponse> getAllByCollege(Long collegeId) {
        log.info("Fetching departments for college ID: {}", collegeId);
        List<Department> departments = departmentRepository.findByCollegeId(collegeId);
        return departments.stream()
                .map(DepartmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Create a new department
     */
    @Transactional
    public DepartmentResponse create(Long collegeId, DepartmentRequest request) {
        log.info("Creating department '{}' for college ID: {}", request.getName(), collegeId);

        // Check if college exists
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new IllegalArgumentException("College not found with ID: " + collegeId));

        // Check if department already exists in this college
        if (departmentRepository.existsByNameAndCollegeId(request.getName(), collegeId)) {
            throw new IllegalArgumentException("Department already exists: " + request.getName());
        }

        Department department = Department.builder()
                .name(request.getName())
                .college(college)
                .active(true)
                .build();

        department = departmentRepository.save(department);
        log.info("Department created with ID: {}", department.getId());

        return DepartmentResponse.fromEntity(department);
    }

    /**
     * Update a department
     */
    @Transactional
    public DepartmentResponse update(Long collegeId, Long departmentId, DepartmentRequest request) {
        log.info("Updating department ID: {} for college ID: {}", departmentId, collegeId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + departmentId));

        // Verify the department belongs to the college
        if (!department.getCollege().getId().equals(collegeId)) {
            throw new IllegalArgumentException("Department does not belong to this college");
        }

        // Check if new name conflicts with existing department
        if (!department.getName().equals(request.getName()) &&
            departmentRepository.existsByNameAndCollegeId(request.getName(), collegeId)) {
            throw new IllegalArgumentException("Department already exists: " + request.getName());
        }

        department.setName(request.getName());
        department = departmentRepository.save(department);

        log.info("Department updated: {}", department.getId());
        return DepartmentResponse.fromEntity(department);
    }

    /**
     * Delete a department
     */
    @Transactional
    public void delete(Long collegeId, Long departmentId) {
        log.info("Deleting department ID: {} for college ID: {}", departmentId, collegeId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + departmentId));

        // Verify the department belongs to the college
        if (!department.getCollege().getId().equals(collegeId)) {
            throw new IllegalArgumentException("Department does not belong to this college");
        }

        departmentRepository.delete(department);
        log.info("Department deleted: {}", departmentId);
    }
}
