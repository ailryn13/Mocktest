package com.mocktest.service.impl;

import com.mocktest.dto.malpractice.MalpracticeLogRequest;
import com.mocktest.dto.malpractice.MalpracticeLogResponse;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Exam;
import com.mocktest.models.MalpracticeLog;
import com.mocktest.models.Submission;
import com.mocktest.models.User;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.MalpracticeLogRepository;
import com.mocktest.repositories.SubmissionRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.MalpracticeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Records proctoring violations and enforces the auto-lock threshold.
 */
@Service
@SuppressWarnings("null")
public class MalpracticeServiceImpl implements MalpracticeService {

    private final MalpracticeLogRepository malpracticeLogRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final SubmissionRepository submissionRepository;

    @Value("${app.malpractice.max-violations}")
    private int maxViolations;

    public MalpracticeServiceImpl(MalpracticeLogRepository malpracticeLogRepository,
                                  UserRepository userRepository,
                                  ExamRepository examRepository,
                                  SubmissionRepository submissionRepository) {
        this.malpracticeLogRepository = malpracticeLogRepository;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.submissionRepository = submissionRepository;
    }

    @Override
    public MalpracticeLogResponse logViolation(MalpracticeLogRequest request, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Exam not found: " + request.getExamId()));

        MalpracticeLog log = new MalpracticeLog(
                student, exam, request.getViolationType(), LocalDateTime.now());
        log = malpracticeLogRepository.save(log);

        long totalViolations = malpracticeLogRepository
                .countByUserIdAndExamId(student.getId(), exam.getId());

        // CRITICAL: If violation type is FULLSCREEN_EXIT or count exceeds threshold,
        // instantly terminate the test by creating a "Locked" submission record.
        boolean deservesTermination = "FULLSCREEN_EXIT".equalsIgnoreCase(request.getViolationType())
                || totalViolations >= maxViolations;

        if (deservesTermination && submissionRepository.findByUserIdAndExamId(student.getId(), exam.getId()).isEmpty()) {
            Submission lockSubmission = new Submission();
            lockSubmission.setUser(student);
            lockSubmission.setExam(exam);
            lockSubmission.setScore(0.0); // Or whatever penalty policy
            lockSubmission.setSubmittedAt(LocalDateTime.now());
            submissionRepository.save(lockSubmission);
        }

        return toResponse(log, totalViolations);
    }

    @Override
    public List<MalpracticeLogResponse> getByUserAndExam(Long userId, Long examId) {
        long count = malpracticeLogRepository.countByUserIdAndExamId(userId, examId);
        return malpracticeLogRepository.findByUserIdAndExamId(userId, examId)
                .stream()
                .map(l -> toResponse(l, count))
                .collect(Collectors.toList());
    }

    @Override
    public List<MalpracticeLogResponse> getByExam(Long examId) {
        return malpracticeLogRepository.findByExamId(examId)
                .stream()
                .map(l -> {
                    long count = malpracticeLogRepository
                            .countByUserIdAndExamId(l.getUser().getId(), examId);
                    return toResponse(l, count);
                })
                .collect(Collectors.toList());
    }

    /* ---- mapper ---- */

    private MalpracticeLogResponse toResponse(MalpracticeLog log, long totalViolations) {
        return new MalpracticeLogResponse(
                log.getId(),
                log.getUser().getId(),
                log.getUser().getName(),
                log.getExam().getId(),
                log.getViolationType(),
                log.getTimestamp(),
                totalViolations);
    }
}
