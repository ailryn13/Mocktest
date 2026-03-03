package com.mocktest.dto.department;

import jakarta.validation.constraints.NotBlank;

public class DepartmentRequest {

    @NotBlank(message = "Department name is required")
    private String name;

    public DepartmentRequest() {}

    public DepartmentRequest(String name) { this.name = name; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
