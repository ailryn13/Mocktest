package com.mocktest.dto.auth;

import java.util.List;

public class LoginResponse {

    private String token;
    private List<String> roles;
    private String fullName;

    public LoginResponse() {}

    public LoginResponse(String token, List<String> roles, String fullName) {
        this.token = token;
        this.roles = roles;
        this.fullName = fullName;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}
