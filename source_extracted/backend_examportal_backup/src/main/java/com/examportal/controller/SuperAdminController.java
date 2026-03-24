package com.examportal.controller;

import com.examportal.dto.CollegeResponse;
import com.examportal.dto.CreateCollegeRequest;
import com.examportal.service.SuperAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    /**
     * Get all colleges
     */
    @GetMapping("/colleges")
    public ResponseEntity<List<CollegeResponse>> getAllColleges() {
        log.info("GET /api/superadmin/colleges - Fetching all colleges");
        List<CollegeResponse> colleges = superAdminService.getAllColleges();
        return ResponseEntity.ok(colleges);
    }

    /**
     * Create a new college
     */
    @PostMapping("/colleges")
    public ResponseEntity<CollegeResponse> createCollege(@Valid @RequestBody CreateCollegeRequest request) {
        log.info("POST /api/superadmin/colleges - Creating college: {}", request.getName());
        
        try {
            CollegeResponse college = superAdminService.createCollege(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(college);
        } catch (IllegalArgumentException e) {
            log.error("Failed to create college: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Delete a college
     */
    @DeleteMapping("/colleges/{id}")
    public ResponseEntity<Map<String, String>> deleteCollege(@PathVariable Long id) {
        log.info("DELETE /api/superadmin/colleges/{} - Deleting college", id);
        
        try {
            superAdminService.deleteCollege(id);
            return ResponseEntity.ok(Map.of("message", "College deleted successfully"));
        } catch (IllegalArgumentException e) {
            log.error("Failed to delete college: {}", e.getMessage());
            throw e;
        }
    }
}
