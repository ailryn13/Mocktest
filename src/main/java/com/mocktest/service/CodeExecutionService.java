package com.mocktest.service;

import com.mocktest.dto.code.CodeExecutionResult;

import java.util.List;

/**
 * Executes student code against hidden test cases via a sandboxed environment.
 */
public interface CodeExecutionService {

    /**
     * Run code against a single test case.
     *
     * @param sourceCode the student's source code
     * @param language   "java", "python", or "cpp"
     * @param stdin      input fed to the program's stdin
     * @return execution result including stdout, stderr, status
     */
    CodeExecutionResult execute(String sourceCode, String language, String stdin);

    /**
     * Map a language string to the Judge0 language id.
     */
    int languageId(String language);
}
