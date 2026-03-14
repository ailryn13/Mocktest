package com.mocktest.service;

import com.mocktest.dto.superadmin.CreateDepartmentRequest;
import com.mocktest.models.Department;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SuperAdminService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminService(DepartmentRepository departmentRepository,
                             UserRepository userRepository,
                             PasswordEncoder passwordEncoder) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Department createDepartment(CreateDepartmentRequest request) {
        if (departmentRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Department with this name already exists");
        }
        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new IllegalArgumentException("Admin email is already taken");
        }

        Department department = new Department(request.getName());
        department.setAddress(request.getAddress());
        department.setCode(request.getCode());
        department = departmentRepository.save(department);

        User adminUser = new User();
        adminUser.setName(request.getAdminName());
        adminUser.setEmail(request.getAdminEmail());
        adminUser.setPasswordHash(passwordEncoder.encode(request.getAdminPassword()));
        adminUser.setRole(Role.ADMIN);
        adminUser.setDepartment(department);
        userRepository.save(adminUser);

        return department;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
}
