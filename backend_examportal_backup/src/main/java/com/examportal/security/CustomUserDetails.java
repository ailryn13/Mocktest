package com.examportal.security;

import com.examportal.entity.User;
import com.examportal.entity.UserRole;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.extern.slf4j.Slf4j;
import com.examportal.entity.Role;

import java.util.Collection;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
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
        if (this.user == null) {
            log.error("[AUTH] User object is NULL in CustomUserDetails");
            return java.util.Collections.emptyList();
        }

        Set<UserRole> roles = this.user.getUserRoles();
        if (roles == null) {
            log.warn("[AUTH] UserRoles set is NULL for user: {}", user.getEmail());
            return java.util.Collections.emptyList();
        }

        List<GrantedAuthority> authorities = new java.util.ArrayList<>();
        try {
            for (UserRole ur : roles) {
                if (ur == null) {
                    log.error("[AUTH] Found NULL UserRole in set for user: {}", user.getEmail());
                    continue;
                }
                Role role = ur.getRole();
                if (role == null) {
                    log.error("[AUTH] UserRole has NULL role for user: {}", user.getEmail());
                    continue;
                }
                String roleName = role.getName();
                if (roleName == null) {
                    log.error("[AUTH] Role has NULL name for user: {}", user.getEmail());
                    continue;
                }
                authorities.add(new SimpleGrantedAuthority(roleName));
                log.debug("[AUTH] Added authority: {} for user: {}", roleName, user.getEmail());
            }
        } catch (Exception e) {
            log.error("[AUTH] Unexpected error while processing authorities for user: {}", user.getEmail(), e);
            throw new RuntimeException("Error processing authorities: " + e.getMessage(), e);
        }

        return authorities;
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
