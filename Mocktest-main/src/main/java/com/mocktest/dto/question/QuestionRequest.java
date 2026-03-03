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

    /** Marks for this question (default 1) */
    private Integer marks = 1;

    /** Difficulty: EASY, MEDIUM, HARD (used for Smart Phase) */
    private String difficulty = "MEDIUM";

    /**
     * For CODING questions: the programming language, e.g. "java", "python", "cpp".
     * Null or blank means any language is accepted.
     */
    private String language;

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

    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
