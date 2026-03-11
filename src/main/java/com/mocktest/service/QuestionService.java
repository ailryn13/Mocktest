package com.mocktest.service;

import com.mocktest.dto.question.QuestionRequest;
import com.mocktest.dto.question.QuestionResponse;

import java.util.List;

public interface QuestionService {

    QuestionResponse create(QuestionRequest request);

    /** Bulk-create multiple questions in one call (CSV or AI paste import). */
    List<QuestionResponse> bulkCreate(List<QuestionRequest> requests);

    List<QuestionResponse> getByExamId(Long examId);

    /**
     * Returns questions with correctAnswer and testCases stripped out –
     * safe for a student during an active exam.
     */
    List<QuestionResponse> getByExamIdForStudent(Long examId);

    QuestionResponse update(Long id, QuestionRequest request);

    void delete(Long id);
}
