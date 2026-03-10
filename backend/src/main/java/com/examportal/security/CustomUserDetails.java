package com.examportal.security;

import com.examportal.entity.User;
import com.examportal.entity.UserRole;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Data
public class CustomUserDetails implements UserDetails {

    private User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // --- DELEGATION METHODS (These were missing!) ---

    public Long getId() {
        return user.getId();
    }

    public String getEmail() {
        return user.getEmail();
    }

    public String getFirstName() {
        return user.getFirstName();
    }

    public String getLastName() {
        return user.getLastName();
    }

    public String getFullName() {
        return user.getFirstName() + " " + user.getLastName();
    }

    public String getDepartment() {
        return user.getDepartment();
    }

    public Long getCollegeId() {
        return user.getCollege() != null ? user.getCollege().getId() : null;
    }

    public String getCollegeName() {
        return user.getCollege() != null ? user.getCollege().getName() : null;
    }

    public boolean isSuperAdmin() {
        return getAuthorities().stream()
                .anyMatch(auth -> "SUPER_ADMIN".equals(auth.getAuthority()));
    }

    public boolean isAdmin() {
        return getAuthorities().stream()
                .anyMatch(auth -> "ADMIN".equals(auth.getAuthority()));
    }

    public boolean isModerator() {
        return getAuthorities().stream()
                .anyMatch(auth -> "MODERATOR".equals(auth.getAuthority()));
    }

    public boolean isStudent() {
        return getAuthorities().stream()
                .anyMatch(auth -> "STUDENT".equals(auth.getAuthority()));
    }

    // --- Factory Method ---

    public static CustomUserDetails build(User user) {
        return new CustomUserDetails(user);
    }

    // --- UserDetails Implementation ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<UserRole> roles = this.user.getUserRoles();
        if (roles == null) {
            return java.util.Collections.emptyList();
        }
        return roles.stream()
                .filter(ur -> ur.getRole() != null && ur.getRole().getRoleName() != null)
                .map(role -> new SimpleGrantedAuthority(role.getRole().getRoleName()))
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        String password = user.getPassword();
        if (password != null && !password.isBlank()) {
            return password;
        }
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.isEnabled();
    }
}
