package com.mocktest.service.impl;

import com.mocktest.dto.department.DepartmentRequest;
import com.mocktest.dto.department.DepartmentResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.DepartmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository,
                                 UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.findByName(request.getName()).isPresent()) {
            throw new BadRequestException("Department already exists: " + request.getName());
        }

        Department dept = new Department(request.getName());

        // For Admins, automatically link to their college
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.mocktest.models.User currentUser = userRepository.findByEmail(email).orElse(null);
        if (currentUser != null && currentUser.getRole() == com.mocktest.models.enums.Role.ADMIN) {
            dept.setParent(currentUser.getDepartment());
        }

        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAll() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.mocktest.models.User currentUser = userRepository.findByEmail(email).orElse(null);

        if (currentUser == null) return List.of();

        // 1. If Admin, show only their sub-departments (the departments they created)
        if (currentUser.getRole() == com.mocktest.models.enums.Role.ADMIN) {
            if (currentUser.getDepartment() != null) {
                return departmentRepository.findByParentId(currentUser.getDepartment().getId())
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
            }
            return List.of();
        }

        // 2. If Mediator, show all sibling departments under the SAME college
        if (currentUser.getRole() == com.mocktest.models.enums.Role.MEDIATOR) {
            if (currentUser.getDepartment() != null) {
                Department myDept = currentUser.getDepartment();
                // If the mediator is in a sub-unit, show siblings (all units under same college)
                Long collegeId = (myDept.getParent() != null) ? myDept.getParent().getId() : myDept.getId();
                
                return departmentRepository.findByParentId(collegeId)
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
            }
            return List.of();
        }

        // 3. For Super Admin, show only top-level Colleges
        return departmentRepository.findByParentIsNull().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        checkAdminAccess(dept);
        return toResponse(dept);
    }

    @Override
    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        checkAdminAccess(dept);
        dept.setName(request.getName());
        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        checkAdminAccess(dept);

        // Null-out the department for any users currently assigned to it
        userRepository.findByDepartmentId(id).forEach(user -> {
            user.setDepartment(null);
            userRepository.save(user);
        });
        departmentRepository.delete(dept);
    }

    private DepartmentResponse toResponse(Department dept) {
        return new DepartmentResponse(dept.getId(), dept.getName());
    }

    private void checkAdminAccess(Department targetDept) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.mocktest.models.User currentUser = userRepository.findByEmail(email).orElse(null);

        if (currentUser != null && currentUser.getRole() == com.mocktest.models.enums.Role.ADMIN) {
            if (targetDept.getParent() == null || !targetDept.getParent().getId().equals(currentUser.getDepartment().getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this department");
            }
        }
    }
}
