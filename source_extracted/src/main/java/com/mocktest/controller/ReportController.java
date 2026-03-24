package com.mocktest.controller;

import com.mocktest.dto.malpractice.MalpracticeLogResponse;
import com.mocktest.dto.submission.SubmissionResponse;
import com.mocktest.service.ExportService;
import com.mocktest.service.MalpracticeService;
import com.mocktest.service.SubmissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Exam;
import com.mocktest.models.User;
import java.security.Principal;
import java.util.List;

/**
 * Mediator endpoints for reviewing grades and malpractice logs.
 */
@RestController
@RequestMapping("/api/mediator/reports")
public class ReportController {

    private final SubmissionService submissionService;
    private final MalpracticeService malpracticeService;
    private final ExportService exportService;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public ReportController(SubmissionService submissionService,
                            MalpracticeService malpracticeService,
                            ExportService exportService,
                            ExamRepository examRepository,
                            UserRepository userRepository) {
        this.submissionService = submissionService;
        this.malpracticeService = malpracticeService;
        this.exportService = exportService;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
    }

    private void verifyAccess(Long examId, Principal principal) {
        User mediator = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Mediator not found"));
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + examId));
        
        if (mediator.getDepartment() == null || exam.getMediator().getDepartment() == null ||
            !mediator.getDepartment().getId().equals(exam.getMediator().getDepartment().getId())) {
            throw new BadRequestException("You can only access reports for exams in your own department");
        }
    }

    @GetMapping("/exams/{examId}/export")
    public ResponseEntity<byte[]> exportExamScores(@PathVariable Long examId, Principal principal) throws java.io.IOException {
        verifyAccess(examId, principal);
        byte[] excelContent = exportService.exportExamScores(examId);
        
        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=exam_" + examId + "_scores.xlsx")
                .body(excelContent);
    }

    @GetMapping("/submissions/exam/{examId}")
    public ResponseEntity<List<SubmissionResponse>> submissionsByExam(
            @PathVariable Long examId, Principal principal) {
        verifyAccess(examId, principal);
        return ResponseEntity.ok(submissionService.getByExamId(examId));
    }

    @GetMapping("/malpractice/exam/{examId}")
    public ResponseEntity<List<MalpracticeLogResponse>> malpracticeByExam(
            @PathVariable Long examId, Principal principal) {
        verifyAccess(examId, principal);
        return ResponseEntity.ok(malpracticeService.getByExam(examId));
    }

    @GetMapping("/malpractice/user/{userId}/exam/{examId}")
    public ResponseEntity<List<MalpracticeLogResponse>> malpracticeByUserAndExam(
            @PathVariable Long userId,
            @PathVariable Long examId, Principal principal) {
        verifyAccess(examId, principal);
        return ResponseEntity.ok(malpracticeService.getByUserAndExam(userId, examId));
    }
}
