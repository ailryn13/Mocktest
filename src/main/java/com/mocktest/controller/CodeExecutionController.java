package com.mocktest.controller;

import com.mocktest.dto.code.CodeExecutionRequest;
import com.mocktest.dto.code.CodeExecutionResult;
import com.mocktest.service.CodeExecutionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Student endpoint for running code against a test input (sandbox execution).
 * This lets students test their code before final submission.
 * Secured via SecurityConfig: /api/student/** → ROLE_STUDENT.
 */
@RestController
@RequestMapping("/api/student/code")
public class CodeExecutionController {

    private static final Logger log = LoggerFactory.getLogger(CodeExecutionController.class);

    private final CodeExecutionService codeExecutionService;

    public CodeExecutionController(CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }

    /**
     * Run student code with custom input (not the hidden test cases).
     * Students use this to test their solution interactively.
     */
    @PostMapping("/run")
    public ResponseEntity<CodeExecutionResult> runCode(
            @Valid @RequestBody CodeExecutionRequest request) {
        
        log.info("[DEBUG] Received runCode request for language: {}", request.getLanguage());
        
        CodeExecutionResult result = codeExecutionService.execute(
                request.getSourceCode(),
                request.getLanguage(),
                request.getStdin());
                
        log.info("[DEBUG] Returning execution result with status code: {}", result.getStatusId());
        return ResponseEntity.ok(result);
    }
}
