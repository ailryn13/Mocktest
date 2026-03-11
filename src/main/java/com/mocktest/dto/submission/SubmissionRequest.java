package com.mocktest.dto.submission;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * Payload a student sends when they finish an exam.
 * Maps question-id → chosen answer (MCQ key or code string).
 */
public class SubmissionRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    /** questionId → student's answer */
    @NotNull(message = "Answers map is required")
    private Map<Long, String> answers;

    public SubmissionRequest() {}

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

    public Map<Long, String> getAnswers() { return answers; }
    public void setAnswers(Map<Long, String> answers) { this.answers = answers; }
}
