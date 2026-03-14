package com.mocktest.security;

import com.mocktest.models.enums.Role;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Custom UserDetails that carries the department information
 * to avoid redundant database lookups in the RlsAspect.
 */
public class UserPrincipal extends org.springframework.security.core.userdetails.User {
    private final Long id;
    private final Long departmentId;
    private final String departmentName;
    private final Role role;

    public UserPrincipal(Long id, String email, String password, Collection<? extends GrantedAuthority> authorities,
                         Long departmentId, String departmentName, Role role) {
        super(email, password, authorities);
        this.id = id;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.role = role;
    }

    public Long getId() { return id; }
    public Long getDepartmentId() { return departmentId; }
    public String getDepartmentName() { return departmentName; }
    public Role getRole() { return role; }
}
