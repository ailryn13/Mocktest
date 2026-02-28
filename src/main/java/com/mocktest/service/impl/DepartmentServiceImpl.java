package com.mocktest.service.impl;

import com.mocktest.dto.department.DepartmentRequest;
import com.mocktest.dto.department.DepartmentResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.service.DepartmentService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Override
    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.findByName(request.getName()).isPresent()) {
            throw new BadRequestException("Department already exists: " + request.getName());
        }
        Department dept = new Department(request.getName());
        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    @Override
    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public DepartmentResponse getById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        return toResponse(dept);
    }

    @Override
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        dept.setName(request.getName());
        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    @Override
    public void delete(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found: " + id);
        }
        departmentRepository.deleteById(id);
    }

    private DepartmentResponse toResponse(Department dept) {
        return new DepartmentResponse(dept.getId(), dept.getName());
    }
}
