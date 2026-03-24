package com.mocktest.service;

import com.mocktest.dto.superadmin.CreateDepartmentRequest;
import com.mocktest.dto.superadmin.DepartmentResponse;
import com.mocktest.dto.superadmin.UpdateDepartmentRequest;
import com.mocktest.models.Department;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mocktest.exception.BadRequestException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
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
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        try {
            if (departmentRepository.findByName(request.getName()).isPresent()) {
                throw new BadRequestException("Department already exists with name: " + request.getName());
            }
            if (userRepository.existsByEmail(request.getAdminEmail())) {
                throw new BadRequestException("Email already taken: " + request.getAdminEmail());
            }

            Department department = new Department(request.getName());
            department.setAddress(request.getAddress());
            department.setCode(request.getCode());
            department = departmentRepository.save(department);
            System.out.println("[DEBUG] Saved department: " + department.getName() + " (ID: " + department.getId() + ")");

            User adminUser = new User();
            adminUser.setName(request.getAdminName());
            adminUser.setEmail(request.getAdminEmail());
            adminUser.setPasswordHash(passwordEncoder.encode(request.getAdminPassword()));
            adminUser.setRole(Role.ADMIN);
            adminUser.setDepartment(department);
            User savedAdmin = userRepository.save(adminUser);
            
            System.out.println("[DEBUG] Created admin user: " + savedAdmin.getEmail() + " (ID: " + savedAdmin.getId() + ") for college: " + department.getName());

            return mapToResponse(department);
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to create department/admin: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findByParentIsNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentResponse updateDepartmentStatus(Long id, Boolean isActive) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        department.setIsActive(isActive);
        return mapToResponse(departmentRepository.save(department));
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new IllegalArgumentException("Department not found");
        }
        List<User> deptUsers = userRepository.findByDepartmentId(id);
        userRepository.deleteAll(deptUsers);
        departmentRepository.deleteById(id);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        
        department.setName(request.getName());
        department.setAddress(request.getAddress());
        department.setCode(request.getCode());
        department = departmentRepository.save(department);

        List<User> admins = userRepository.findByRoleAndDepartmentId(Role.ADMIN, id);
        if (!admins.isEmpty()) {
            User admin = admins.get(0);
            
            // If changing email, check if it's taken
            if (!admin.getEmail().equals(request.getAdminEmail()) && userRepository.existsByEmail(request.getAdminEmail())) {
                throw new IllegalArgumentException("Admin email is already taken by another user");
            }

            admin.setName(request.getAdminName());
            admin.setEmail(request.getAdminEmail());
            
            if (request.getAdminPassword() != null && !request.getAdminPassword().isBlank()) {
                admin.setPasswordHash(passwordEncoder.encode(request.getAdminPassword()));
            }
            userRepository.save(admin);
        }

        return mapToResponse(department);
    }

    private DepartmentResponse mapToResponse(Department dept) {
        DepartmentResponse res = new DepartmentResponse();
        res.setId(dept.getId());
        res.setName(dept.getName());
        res.setAddress(dept.getAddress());
        res.setCode(dept.getCode());
        res.setIsActive(dept.getIsActive());
        
        List<User> admins = userRepository.findByRoleAndDepartmentId(Role.ADMIN, dept.getId());
        if (!admins.isEmpty()) {
            res.setAdminName(admins.get(0).getName());
            res.setAdminEmail(admins.get(0).getEmail());
        }
        return res;
    }
}
