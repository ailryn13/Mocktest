package com.mocktest.service;

import com.mocktest.dto.question.QuestionRequest;
import com.mocktest.dto.question.QuestionResponse;

import java.util.List;

public interface QuestionService {

    QuestionResponse create(QuestionRequest request, String mediatorEmail);

    /** Bulk-create multiple questions in one call (CSV or AI paste import). */
    List<QuestionResponse> bulkCreate(List<QuestionRequest> requests, String mediatorEmail);

    List<QuestionResponse> getByExamId(Long examId, String mediatorEmail);

    /**
     * safe for a student during an active exam.
     */
    List<QuestionResponse> getByExamIdForStudent(Long examId, String studentEmail);

    QuestionResponse update(Long id, QuestionRequest request, String mediatorEmail);

    void delete(Long id, String mediatorEmail);
}
