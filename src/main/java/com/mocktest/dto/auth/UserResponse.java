package com.mocktest.dto.auth;

public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String departmentName;
    private Long departmentId;

    public UserResponse() {}

    public UserResponse(Long id, String name, String email, String departmentName, Long departmentId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.departmentName = departmentName;
        this.departmentId = departmentId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
}
