package com.examportal.dto;

import com.examportal.entity.College;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollegeResponse {

    private Long id;
    private String name;
    private String code;
    private String location;
    private String adminEmail;
    private String adminName;
    private Boolean active;
    private LocalDateTime createdAt;

    public static CollegeResponse fromEntity(College college, String adminEmail, String adminName) {
        return CollegeResponse.builder()
                .id(college.getId())
                .name(college.getName())
                .code(college.getCode())
                .location(college.getAddress())
                .adminEmail(adminEmail)
                .adminName(adminName)
                .active(college.getActive())
                .createdAt(college.getCreatedAt())
                .build();
    }
}
