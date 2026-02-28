package com.mocktest.service;

import com.mocktest.dto.department.DepartmentRequest;
import com.mocktest.dto.department.DepartmentResponse;

import java.util.List;

public interface DepartmentService {

    DepartmentResponse create(DepartmentRequest request);

    List<DepartmentResponse> getAll();

    DepartmentResponse getById(Long id);

    DepartmentResponse update(Long id, DepartmentRequest request);

    void delete(Long id);
}
