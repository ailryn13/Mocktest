package com.mocktest.controller;

import com.mocktest.dto.superadmin.CreateDepartmentRequest;
import com.mocktest.dto.superadmin.DepartmentResponse;
import com.mocktest.dto.superadmin.UpdateDepartmentRequest;
import com.mocktest.dto.superadmin.UpdateDepartmentStatusRequest;
import com.mocktest.service.SuperAdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/super-admin/departments", "/api/superadmin/colleges"})
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(@RequestBody CreateDepartmentRequest request) {
        DepartmentResponse department = superAdminService.createDepartment(request);
        return new ResponseEntity<>(department, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        List<DepartmentResponse> departments = superAdminService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(@PathVariable Long id, @RequestBody UpdateDepartmentRequest request) {
        DepartmentResponse updated = superAdminService.updateDepartment(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        superAdminService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DepartmentResponse> toggleDepartmentStatus(@PathVariable Long id, @RequestBody UpdateDepartmentStatusRequest request) {
        DepartmentResponse updated = superAdminService.updateDepartmentStatus(id, request.getIsActive());
        return ResponseEntity.ok(updated);
    }
}
