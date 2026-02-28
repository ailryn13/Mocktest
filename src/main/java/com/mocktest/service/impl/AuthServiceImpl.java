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
import com.mocktest.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@SuppressWarnings("null")
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthServiceImpl(AuthenticationManager authManager,
                           UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider) {
        this.authManager = authManager;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // Spring Security will throw BadCredentialsException on failure
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = tokenProvider.generateToken(
                user.getEmail(), user.getRole().name());

        return new LoginResponse(token, user.getRole().name(), user.getName());
    }

    @Override
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + request.getDepartmentId()));

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid role: " + request.getRole() + ". Must be ADMIN, MEDIATOR or STUDENT");
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                role,
                department);

        userRepository.save(user);
        return "User registered successfully";
    }
}
