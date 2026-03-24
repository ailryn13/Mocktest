package com.examportal.controller;

import com.examportal.entity.College;
import com.examportal.service.CollegeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * College Management Controller
 * Only SUPER_ADMIN can manage colleges
 */
@RestController
@RequestMapping("/api/colleges")
@PreAuthorize("hasAuthority('SUPER_ADMIN')")
public class CollegeController {

    @Autowired
    private CollegeService collegeService;

    /**
     * Get all colleges
     */
    @GetMapping
    public ResponseEntity<List<College>> getAllColleges() {
        List<College> colleges = collegeService.getAllColleges();
        return ResponseEntity.ok(colleges);
    }

    /**
     * Get all active colleges
     */
    @GetMapping("/active")
    public ResponseEntity<List<College>> getAllActiveColleges() {
        List<College> colleges = collegeService.getAllActiveColleges();
        return ResponseEntity.ok(colleges);
    }

    /**
     * Get college by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<College> getCollegeById(@PathVariable Long id) {
        return collegeService.getCollegeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get college by code
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<College> getCollegeByCode(@PathVariable String code) {
        return collegeService.getCollegeByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new college
     */
    @PostMapping
    public ResponseEntity<?> createCollege(@Valid @RequestBody College college) {
        try {
            College created = collegeService.createCollege(college);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update college
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCollege(@PathVariable Long id, @Valid @RequestBody College college) {
        try {
            College updated = collegeService.updateCollege(id, college);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Deactivate college (soft delete)
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<College> deactivateCollege(@PathVariable Long id) {
        try {
            College college = collegeService.deactivateCollege(id);
            return ResponseEntity.ok(college);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Activate college
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<College> activateCollege(@PathVariable Long id) {
        try {
            College college = collegeService.activateCollege(id);
            return ResponseEntity.ok(college);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get active colleges count
     */
    @GetMapping("/stats/count")
    public ResponseEntity<Map<String, Long>> getActiveCollegesCount() {
        long count = collegeService.getActiveCollegesCount();
        return ResponseEntity.ok(Map.of("activeColleges", count));
    }

    /**
     * Get detailed statistics for a specific college
     * Returns user counts (students, moderators, admins), test counts, etc.
     */
    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getCollegeStatistics(@PathVariable Long id) {
        try {
            Map<String, Object> stats = collegeService.getCollegeStatistics(id);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get user counts by role for a specific college
     * Example response: { "students": 2500, "moderators": 10, "admins": 2, "totalUsers": 2512 }
     */
    @GetMapping("/{id}/users/count")
    public ResponseEntity<Map<String, Long>> getUserCountsByRole(@PathVariable Long id) {
        try {
            Map<String, Long> counts = collegeService.getUserCountsByRole(id);
            return ResponseEntity.ok(counts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all colleges with their basic statistics
     * Returns list of colleges with user counts, test counts, etc.
     */
    @GetMapping("/with-stats")
    public ResponseEntity<List<Map<String, Object>>> getAllCollegesWithStats() {
        List<Map<String, Object>> collegesWithStats = collegeService.getAllCollegesWithStats();
        return ResponseEntity.ok(collegesWithStats);
    }
}
