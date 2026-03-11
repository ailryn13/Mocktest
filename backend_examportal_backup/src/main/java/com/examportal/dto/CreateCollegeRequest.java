package com.examportal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCollegeRequest {

    @NotBlank(message = "College name is required")
    @Size(max = 100, message = "College name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "College code is required")
    @Size(max = 50, message = "College code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Location/Address is required")
    @Size(max = 500, message = "Location must not exceed 500 characters")
    private String location;

    @Email(message = "Invalid email format")
    private String adminEmail; // Optional - can be assigned later
}
