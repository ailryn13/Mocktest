package com.mocktest.service;

import com.mocktest.dto.submission.SubmissionRequest;
import com.mocktest.dto.submission.SubmissionResponse;

import java.util.List;

public interface SubmissionService {

    /** Grade the student's answers and persist the submission. */
    SubmissionResponse submit(SubmissionRequest request, String studentEmail);

    SubmissionResponse getByUserAndExam(Long userId, Long examId);

    List<SubmissionResponse> getByExamId(Long examId);

    List<SubmissionResponse> getByUserId(Long userId);
}
