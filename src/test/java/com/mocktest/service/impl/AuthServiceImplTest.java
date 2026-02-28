package com.mocktest.service.impl;

import com.mocktest.dto.auth.LoginRequest;
import com.mocktest.dto.auth.LoginResponse;
import com.mocktest.dto.auth.RegisterRequest;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private Department testDepartment;

    @BeforeEach
    void setUp() {
        testDepartment = new Department("Computer Science");
        testDepartment.setId(1L);

        testUser = new User("John Doe", "john@example.com", "hashedPassword", Role.STUDENT, testDepartment);
        testUser.setId(1L);
    }

    @Test
    void login_withValidCredentials_returnsLoginResponse() {
        // Arrange
        LoginRequest request = new LoginRequest("john@example.com", "password123");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));
        when(tokenProvider.generateToken("john@example.com", "STUDENT")).thenReturn("jwt-token");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("STUDENT", response.getRole());
        assertEquals("John Doe", response.getName());
        verify(authManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_withNonExistentUser_throwsResourceNotFoundException() {
        // Arrange
        LoginRequest request = new LoginRequest("unknown@example.com", "password");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> authService.login(request));
    }

    @Test
    void register_withValidRequest_returnsSuccessMessage() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");
        request.setRole("STUDENT");
        request.setDepartmentId(1L);

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(testDepartment));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        // Act
        String result = authService.register(request);

        // Assert
        assertEquals("User registered successfully", result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_withExistingEmail_throwsBadRequestException() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("john@example.com");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_withInvalidDepartment_throwsResourceNotFoundException() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setDepartmentId(999L);

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(departmentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> authService.register(request));
    }

    @Test
    void register_withInvalidRole_throwsBadRequestException() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setRole("INVALID_ROLE");
        request.setDepartmentId(1L);

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(testDepartment));

        // Act & Assert
        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    void register_withMediatorRole_succeeds() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setName("Mediator User");
        request.setEmail("mediator@example.com");
        request.setPassword("password");
        request.setRole("MEDIATOR");
        request.setDepartmentId(1L);

        when(userRepository.existsByEmail("mediator@example.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(testDepartment));
        when(passwordEncoder.encode("password")).thenReturn("encoded");

        // Act
        String result = authService.register(request);

        // Assert
        assertEquals("User registered successfully", result);
        verify(userRepository).save(any(User.class));
    }
}
