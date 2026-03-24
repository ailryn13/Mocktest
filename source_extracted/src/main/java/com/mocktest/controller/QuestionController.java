package com.mocktest.controller;

import com.mocktest.dto.question.QuestionRequest;
import com.mocktest.dto.question.QuestionResponse;
import com.mocktest.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Mediator endpoints for question management.
 * Secured via SecurityConfig: /api/mediator/** → ROLE_MEDIATOR.
 */
@RestController
@RequestMapping("/api/mediator/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> create(
            @Valid @RequestBody QuestionRequest request, Principal principal) {
        return ResponseEntity.ok(questionService.create(request, principal.getName()));
    }

    /** Bulk-create questions from CSV/Excel or AI-paste import. */
    @PostMapping("/bulk")
    public ResponseEntity<List<QuestionResponse>> bulkCreate(
            @RequestBody List<QuestionRequest> requests, Principal principal) {
        return ResponseEntity.ok(questionService.bulkCreate(requests, principal.getName()));
    }

    /** Returns full question data including answers (mediator view). */
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<QuestionResponse>> getByExam(@PathVariable Long examId, Principal principal) {
        return ResponseEntity.ok(questionService.getByExamId(examId, principal.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request, Principal principal) {
        return ResponseEntity.ok(questionService.update(id, request, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal principal) {
        questionService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
