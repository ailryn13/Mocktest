package com.mocktest.dto.exam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class ExamRequest {

    @NotBlank(message = "Exam title is required")
    private String title;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotNull(message = "Duration (minutes) is required")
    private Integer durationMinutes;

    /** MCQ, CODING, or HYBRID. Defaults to MCQ if not supplied. */
    private String examType = "MCQ";

    // ── Coding Constraints ─────────────────────────────────────────
    private java.util.List<String> allowedLanguages = new java.util.ArrayList<>();
    private java.util.List<String> bannedKeywords   = new java.util.ArrayList<>();
    private Boolean mustUseRecursion  = false;
    private Boolean mustUseOOP        = false;
    private Integer timeLimitSeconds  = 5;
    private Integer memoryLimitMb     = 256;

    public ExamRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }

    public java.util.List<String> getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(java.util.List<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }

    public java.util.List<String> getBannedKeywords() { return bannedKeywords; }
    public void setBannedKeywords(java.util.List<String> bannedKeywords) { this.bannedKeywords = bannedKeywords; }

    public Boolean getMustUseRecursion() { return mustUseRecursion; }
    public void setMustUseRecursion(Boolean mustUseRecursion) { this.mustUseRecursion = mustUseRecursion; }

    public Boolean getMustUseOOP() { return mustUseOOP; }
    public void setMustUseOOP(Boolean mustUseOOP) { this.mustUseOOP = mustUseOOP; }

    public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

    public Integer getMemoryLimitMb() { return memoryLimitMb; }
    public void setMemoryLimitMb(Integer memoryLimitMb) { this.memoryLimitMb = memoryLimitMb; }
}
