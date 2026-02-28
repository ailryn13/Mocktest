package com.mocktest.dto.submission;

import java.time.LocalDateTime;

public class SubmissionResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long examId;
    private String examTitle;
    private Double score;
    private LocalDateTime submittedAt;

    public SubmissionResponse() {}

    public SubmissionResponse(Long id, Long userId, String userName,
                              Long examId, String examTitle,
                              Double score, LocalDateTime submittedAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.examId = examId;
        this.examTitle = examTitle;
        this.score = score;
        this.submittedAt = submittedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

    public String getExamTitle() { return examTitle; }
    public void setExamTitle(String examTitle) { this.examTitle = examTitle; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
