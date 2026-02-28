package com.mocktest.security;

import com.mocktest.models.Department;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        Department dept = new Department("CS");
        dept.setId(1L);
        testUser = new User("John", "john@test.com", "hashedPw", Role.STUDENT, dept);
        testUser.setId(1L);
    }

    @Test
    void loadUserByUsername_withExistingEmail_returnsUserDetails() {
        // Arrange
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = userDetailsService.loadUserByUsername("john@test.com");

        // Assert
        assertNotNull(userDetails);
        assertEquals("john@test.com", userDetails.getUsername());
        assertEquals("hashedPw", userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT")));
    }

    @Test
    void loadUserByUsername_withAdminRole_hasCorrectAuthority() {
        // Arrange
        testUser.setRole(Role.ADMIN);
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = userDetailsService.loadUserByUsername("john@test.com");

        // Assert
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void loadUserByUsername_withMediatorRole_hasCorrectAuthority() {
        // Arrange
        testUser.setRole(Role.MEDIATOR);
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = userDetailsService.loadUserByUsername("john@test.com");

        // Assert
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEDIATOR")));
    }

    @Test
    void loadUserByUsername_withNonExistentEmail_throwsUsernameNotFoundException() {
        // Arrange
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("unknown@test.com"));
    }

    @Test
    void loadUserByUsername_returnsExactlyOneAuthority() {
        // Arrange
        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = userDetailsService.loadUserByUsername("john@test.com");

        // Assert
        assertEquals(1, userDetails.getAuthorities().size());
    }
}
