package com.mocktest.dto.question;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QuestionRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotBlank(message = "Question type is required (MCQ or CODING)")
    private String type;   // "MCQ" or "CODING"

    @NotBlank(message = "Question content is required")
    private String content;

    /** JSON string – required for MCQ, null for CODING */
    private String options;

    /** Correct answer key for MCQ (e.g. "A") */
    private String correctAnswer;

    /** JSON string – required for CODING, null for MCQ */
    private String testCases;

    public QuestionRequest() {}

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getTestCases() { return testCases; }
    public void setTestCases(String testCases) { this.testCases = testCases; }
}
