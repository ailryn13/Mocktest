package com.mocktest.controller;

import com.mocktest.dto.malpractice.MalpracticeLogResponse;
import com.mocktest.dto.submission.SubmissionResponse;
import com.mocktest.service.MalpracticeService;
import com.mocktest.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mediator endpoints for reviewing grades and malpractice logs.
 */
@RestController
@RequestMapping("/api/mediator/reports")
public class ReportController {

    private final SubmissionService submissionService;
    private final MalpracticeService malpracticeService;

    public ReportController(SubmissionService submissionService,
                            MalpracticeService malpracticeService) {
        this.submissionService = submissionService;
        this.malpracticeService = malpracticeService;
    }

    @GetMapping("/submissions/exam/{examId}")
    public ResponseEntity<List<SubmissionResponse>> submissionsByExam(
            @PathVariable Long examId) {
        return ResponseEntity.ok(submissionService.getByExamId(examId));
    }

    @GetMapping("/malpractice/exam/{examId}")
    public ResponseEntity<List<MalpracticeLogResponse>> malpracticeByExam(
            @PathVariable Long examId) {
        return ResponseEntity.ok(malpracticeService.getByExam(examId));
    }

    @GetMapping("/malpractice/user/{userId}/exam/{examId}")
    public ResponseEntity<List<MalpracticeLogResponse>> malpracticeByUserAndExam(
            @PathVariable Long userId,
            @PathVariable Long examId) {
        return ResponseEntity.ok(malpracticeService.getByUserAndExam(userId, examId));
    }
}
