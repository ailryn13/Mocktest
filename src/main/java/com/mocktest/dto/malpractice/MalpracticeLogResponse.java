package com.mocktest.dto.malpractice;

import java.time.LocalDateTime;

public class MalpracticeLogResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long examId;
    private String violationType;
    private LocalDateTime timestamp;
    private long totalViolations;  // running count for this user+exam

    public MalpracticeLogResponse() {}

    public MalpracticeLogResponse(Long id, Long userId, String userName, Long examId,
                                  String violationType, LocalDateTime timestamp,
                                  long totalViolations) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.examId = examId;
        this.violationType = violationType;
        this.timestamp = timestamp;
        this.totalViolations = totalViolations;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

    public String getViolationType() { return violationType; }
    public void setViolationType(String violationType) { this.violationType = violationType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public long getTotalViolations() { return totalViolations; }
    public void setTotalViolations(long totalViolations) { this.totalViolations = totalViolations; }
}
