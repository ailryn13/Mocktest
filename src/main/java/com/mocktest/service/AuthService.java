package com.mocktest.service;

import com.mocktest.dto.auth.LoginRequest;
import com.mocktest.dto.auth.LoginResponse;
import com.mocktest.dto.auth.RegisterRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    String register(RegisterRequest request);

    /** Admin-only: register a mediator (forces MEDIATOR role). */
    String registerMediator(RegisterRequest request);

    /** Mediator-only: register a student (forces STUDENT role). */
    String registerStudent(RegisterRequest request);
}
