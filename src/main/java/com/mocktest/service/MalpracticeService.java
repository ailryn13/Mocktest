package com.mocktest.service;

import com.mocktest.dto.malpractice.MalpracticeLogRequest;
import com.mocktest.dto.malpractice.MalpracticeLogResponse;

import java.util.List;

public interface MalpracticeService {

    /**
     * Log a new violation. If the total violation count reaches the
     * threshold, the exam is auto-submitted for the student.
     *
     * @return the saved log including the running violation count
     */
    MalpracticeLogResponse logViolation(MalpracticeLogRequest request, String studentEmail);

    List<MalpracticeLogResponse> getByUserAndExam(Long userId, Long examId);

    List<MalpracticeLogResponse> getByExam(Long examId);
}
