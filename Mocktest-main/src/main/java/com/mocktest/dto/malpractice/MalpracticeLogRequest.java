package com.mocktest.dto.malpractice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MalpracticeLogRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotBlank(message = "Violation type is required")
    private String violationType;  // e.g. "TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT"

    public MalpracticeLogRequest() {}

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

    public String getViolationType() { return violationType; }
    public void setViolationType(String violationType) { this.violationType = violationType; }
}
