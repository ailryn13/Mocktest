package com.mocktest.dto.code;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Represents a single code execution request (used internally when grading
 * coding questions against each test case).
 */
public class CodeExecutionRequest {

    @NotBlank
    private String sourceCode;

    @NotBlank
    private String language;   // "java", "python", "cpp"

    private String stdin;      // test-case input fed to the program

    @NotNull
    private Long questionId;

    public CodeExecutionRequest() {}

    public CodeExecutionRequest(String sourceCode, String language, String stdin, Long questionId) {
        this.sourceCode = sourceCode;
        this.language = language;
        this.stdin = stdin;
        this.questionId = questionId;
    }

    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getStdin() { return stdin; }
    public void setStdin(String stdin) { this.stdin = stdin; }

    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
}
