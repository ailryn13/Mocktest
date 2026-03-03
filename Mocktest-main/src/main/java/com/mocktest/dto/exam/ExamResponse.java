package com.mocktest.dto.exam;

import java.time.LocalDateTime;

public class ExamResponse {

    private Long id;
    private String title;
    private String mediatorName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String examType;

    // ── Coding Constraints ─────────────────────────────────────────
    private java.util.List<String> allowedLanguages = new java.util.ArrayList<>();
    private java.util.List<String> bannedKeywords   = new java.util.ArrayList<>();
    private Boolean mustUseRecursion = false;
    private Boolean mustUseOOP       = false;
    private Integer timeLimitSeconds = 5;
    private Integer memoryLimitMb    = 256;

    public ExamResponse() {}

    public ExamResponse(Long id, String title, String mediatorName,
                        LocalDateTime startTime, LocalDateTime endTime,
                        Integer durationMinutes, String examType) {
        this.id = id;
        this.title = title;
        this.mediatorName = mediatorName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.examType = examType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMediatorName() { return mediatorName; }
    public void setMediatorName(String mediatorName) { this.mediatorName = mediatorName; }

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
