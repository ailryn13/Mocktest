package com.mocktest.service.impl;

import com.mocktest.dto.auth.LoginRequest;
import com.mocktest.dto.auth.LoginResponse;
import com.mocktest.dto.auth.RegisterRequest;
import com.mocktest.dto.auth.UserResponse;
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
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;
import java.util.stream.Collectors;

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
        System.out.println("[DEBUG] Login attempt for user: " + request.getEmail());
        try {
            // Spring Security will throw BadCredentialsException on failure
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            String token = tokenProvider.generateToken(
                    user.getEmail(), user.getRole().name());

            System.out.println("[DEBUG] Login successful for user: " + request.getEmail() + " with role: " + user.getRole());
            
            Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
            String deptName = user.getDepartment() != null ? user.getDepartment().getName() : null;

            return new LoginResponse(
                token, 
                java.util.List.of(user.getRole().name()), 
                user.getName(),
                deptId,
                deptName
            );
        } catch (Exception e) {
            System.err.println("[ERROR] Login failed for user: " + request.getEmail() + " - " + e.getMessage());
            throw e;
        }
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

        User savedUser = userRepository.save(user);
        
        System.out.println("[DEBUG] Created user: " + savedUser.getEmail() + " (ID: "+savedUser.getId()+") for department: " + department.getName());

        return "User registered successfully";
    }

    @Override
    public String registerMediator(RegisterRequest request) {
        request.setRole("MEDIATOR");
        return register(request);
    }

    @Override
    public String registerStudent(RegisterRequest request) {
        request.setRole("STUDENT");
        return register(request);
    }

    @Override
    public List<UserResponse> getAllMediators() {
        return userRepository.findByRole(Role.MEDIATOR)
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getMediatorsForAdmin() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String currentEmail;
        if (principal instanceof UserDetails) {
            currentEmail = ((UserDetails) principal).getUsername();
        } else {
            currentEmail = principal.toString();
        }

        User admin = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (admin.getDepartment() == null) {
            // If it's the system-level admin with no department, return all (fallback)
            return getAllMediators();
        }

        return userRepository.findByRoleAndDepartmentId(Role.MEDIATOR, admin.getDepartment().getId())
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateMediator(Long id, RegisterRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mediator not found with id: " + id));

        if (user.getRole() != Role.MEDIATOR) {
            throw new BadRequestException("User is not a mediator");
        }

        // Check if updating to an already taken email (by someone else)
        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already taken");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setDepartment(department);

        // Update password only if provided
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void deleteMediator(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mediator not found with id: " + id));

        if (user.getRole() != Role.MEDIATOR) {
            throw new BadRequestException("Only mediator accounts can be deleted through this endpoint");
        }

        userRepository.delete(user);
    }

    private UserResponse mapToUserResponse(User user) {
        String deptName = user.getDepartment() != null ? user.getDepartment().getName() : "No Department";
        Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), deptName, deptId);
    }
}
