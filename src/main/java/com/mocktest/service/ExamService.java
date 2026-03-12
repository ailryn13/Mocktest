package com.mocktest.service;

import com.mocktest.dto.exam.ExamRequest;
import com.mocktest.dto.exam.ExamResponse;

import java.util.List;

public interface ExamService {

    ExamResponse create(ExamRequest request, String mediatorEmail);

    List<ExamResponse> getByMediator(String mediatorEmail);

    List<ExamResponse> getActiveExams();

    /** Active exams visible to a specific student (filtered by department). */
    List<ExamResponse> getActiveExamsForStudent(String studentEmail);

    ExamResponse getById(Long id, String userEmail);

    ExamResponse update(Long id, ExamRequest request, String mediatorEmail);

    void delete(Long id, String mediatorEmail);
}
