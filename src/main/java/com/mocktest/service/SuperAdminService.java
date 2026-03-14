package com.mocktest.service;

import com.mocktest.dto.superadmin.CreateAdminRequest;
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
        Department department = new Department(request.getName());
        return departmentRepository.save(department);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @Transactional
    public User createDepartmentAdmin(Long departmentId, CreateAdminRequest request) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already taken");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ADMIN);
        user.setDepartment(department);

        return userRepository.save(user);
    }
}
