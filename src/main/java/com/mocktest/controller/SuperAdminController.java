package com.mocktest.controller;

import com.mocktest.dto.superadmin.CreateAdminRequest;
import com.mocktest.dto.superadmin.CreateDepartmentRequest;
import com.mocktest.models.Department;
import com.mocktest.models.User;
import com.mocktest.service.SuperAdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin/departments")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody CreateDepartmentRequest request) {
        Department department = superAdminService.createDepartment(request);
        return new ResponseEntity<>(department, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        List<Department> departments = superAdminService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @PostMapping("/{id}/admins")
    public ResponseEntity<User> createDepartmentAdmin(@PathVariable Long id, @RequestBody CreateAdminRequest request) {
        User admin = superAdminService.createDepartmentAdmin(id, request);
        return new ResponseEntity<>(admin, HttpStatus.CREATED);
    }
}
