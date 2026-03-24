package com.mocktest.dto.auth;

import java.util.List;

public class LoginResponse {

    private String token;
    private List<String> roles;
    private String fullName;
    private Long departmentId;
    private String departmentName;

    public LoginResponse() {}

    public LoginResponse(String token, List<String> roles, String fullName, Long departmentId, String departmentName) {
        this.token = token;
        this.roles = roles;
        this.fullName = fullName;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
}
