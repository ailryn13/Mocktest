package com.examportal.controller;

import com.examportal.entity.Test;
import com.examportal.repository.StudentAttemptRepository;
import com.examportal.repository.TestRepository;
import com.examportal.security.DepartmentSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final StudentAttemptRepository attemptRepository;
    private final TestRepository testRepository;
    private final DepartmentSecurityService departmentSecurityService;

    @GetMapping("/reset-sampletest")
    public ResponseEntity<?> resetSampleTest() {
        Long studentId = departmentSecurityService.getCurrentUserId();
        log.info("Resetting sample tests for student ID: {}", studentId);

        // Find all tests with "sample" in the title
        List<Long> sampleTestIds = testRepository.findAll().stream()
                .filter(test -> test.getTitle().toLowerCase().contains("sample"))
                .map(Test::getId)
                .collect(Collectors.toList());

        if (sampleTestIds.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No sample tests found to reset."));
        }

        int deletedCount = 0;
        for (Long testId : sampleTestIds) {
            var attemptOpt = attemptRepository.findByTestIdAndStudentId(testId, studentId);
            if (attemptOpt.isPresent()) {
                attemptRepository.delete(attemptOpt.get());
                deletedCount++;
                log.info("Deleted attempt for test ID: {}", testId);
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Successfully reset sample tests.",
                "deletedAttemptsCount", deletedCount,
                "sampleTestIdsProcessed", sampleTestIds));
    }

    @GetMapping("/reset-test/{testId}")
    public ResponseEntity<?> resetSpecificTest(@org.springframework.web.bind.annotation.PathVariable Long testId) {
        Long studentId = departmentSecurityService.getCurrentUserId();
        log.info("Resetting test {} for student ID: {}", testId, studentId);

        var attemptOpt = attemptRepository.findByTestIdAndStudentId(testId, studentId);
        if (attemptOpt.isPresent()) {
            attemptRepository.delete(attemptOpt.get());
            log.info("Deleted attempt for test ID: {}", testId);
            return ResponseEntity.ok(Map.of(
                    "message", "Test attempt reset successfully.",
                    "testId", testId));
        } else {
            return ResponseEntity.ok(Map.of(
                    "message", "No attempt found for this test.",
                    "testId", testId));
        }
    }
}
