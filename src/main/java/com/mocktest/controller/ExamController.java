package com.mocktest.controller;

import com.mocktest.dto.exam.ExamRequest;
import com.mocktest.dto.exam.ExamResponse;
import com.mocktest.service.ExamService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mediator endpoints for exam CRUD.
 * Secured via SecurityConfig: /api/mediator/** → ROLE_MEDIATOR.
 */
@RestController
@RequestMapping("/api/mediator/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @PostMapping
    public ResponseEntity<ExamResponse> create(
            @Valid @RequestBody ExamRequest request,
            Authentication auth) {
        return ResponseEntity.ok(examService.create(request, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<ExamResponse>> getMyExams(Authentication auth) {
        return ResponseEntity.ok(examService.getByMediator(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ExamRequest request,
            Authentication auth) {
        return ResponseEntity.ok(examService.update(id, request, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        examService.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
