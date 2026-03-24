package com.mocktest.controller;

import com.mocktest.dto.exam.ExamResponse;
import com.mocktest.dto.malpractice.MalpracticeLogRequest;
import com.mocktest.dto.malpractice.MalpracticeLogResponse;
import com.mocktest.dto.question.QuestionResponse;
import com.mocktest.dto.submission.SubmissionRequest;
import com.mocktest.dto.submission.SubmissionResponse;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.User;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.ExamService;
import com.mocktest.service.MalpracticeService;
import com.mocktest.service.QuestionService;
import com.mocktest.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Student-facing endpoints: view exams, take exams, submit answers,
 * report malpractice events, and view scores.
 * Secured via SecurityConfig: /api/student/** → ROLE_STUDENT.
 */
@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final ExamService examService;
    private final QuestionService questionService;
    private final SubmissionService submissionService;
    private final MalpracticeService malpracticeService;
    private final UserRepository userRepository;

    public StudentController(ExamService examService,
                             QuestionService questionService,
                             SubmissionService submissionService,
                             MalpracticeService malpracticeService,
                             UserRepository userRepository) {
        this.examService = examService;
        this.questionService = questionService;
        this.submissionService = submissionService;
        this.malpracticeService = malpracticeService;
        this.userRepository = userRepository;
    }

    /* ---- Exam Discovery ---- */

    @GetMapping("/exams/active")
    public ResponseEntity<List<ExamResponse>> getActiveExams(Authentication auth) {
        return ResponseEntity.ok(examService.getActiveExamsForStudent(auth.getName()));
    }

    @GetMapping("/exams/{examId}")
    public ResponseEntity<ExamResponse> getExam(@PathVariable Long examId, Authentication auth) {
        return ResponseEntity.ok(examService.getById(examId, auth.getName()));
    }

    /* ---- Exam Questions (answers hidden) ---- */

    @GetMapping("/exams/{examId}/questions")
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @PathVariable Long examId,
            Authentication auth) {
        return ResponseEntity.ok(questionService.getByExamIdForStudent(examId, auth.getName()));
    }

    /* ---- Submission ---- */

    @PostMapping("/submit")
    public ResponseEntity<SubmissionResponse> submitExam(
            @Valid @RequestBody SubmissionRequest request,
            Authentication auth) {
        return ResponseEntity.ok(submissionService.submit(request, auth.getName()));
    }

    @GetMapping("/scores")
    public ResponseEntity<List<SubmissionResponse>> myScores(Authentication auth) {
        // auth.getName() is the email, need to resolve userId inside service
        // For simplicity we expose submissions by the current user
        return ResponseEntity.ok(
                submissionService.getByUserId(
                        getUserIdFromAuth(auth)));
    }

    /* ---- Malpractice Reporting ---- */

    @PostMapping("/malpractice")
    public ResponseEntity<MalpracticeLogResponse> reportViolation(
            @Valid @RequestBody MalpracticeLogRequest request,
            Authentication auth) {
        return ResponseEntity.ok(
                malpracticeService.logViolation(request, auth.getName()));
    }

    /* ---- helper ---- */

    private Long getUserIdFromAuth(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }
}
