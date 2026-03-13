package com.mocktest.dto.code;

/**
 * Result of running student code against a single test case.
 */
public class CodeExecutionResult {

    private boolean passed;
    private String actualOutput;
    private String expectedOutput;
    private String stderr;
    private String compileOutput;
    private double executionTimeMs;
    private String statusDescription;
    private String testInput;

    public CodeExecutionResult() {}

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public String getActualOutput() { return actualOutput; }
    public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }

    public String getCompileOutput() { return compileOutput; }
    public void setCompileOutput(String compileOutput) { this.compileOutput = compileOutput; }

    public double getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(double executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public int getStatusId() { return statusId; }
    public void setStatusId(int statusId) { this.statusId = statusId; }

    public String getStatusDescription() { return statusDescription; }
    public void setStatusDescription(String statusDescription) { this.statusDescription = statusDescription; }

    public String getTestInput() { return testInput; }
    public void setTestInput(String testInput) { this.testInput = testInput; }
}
