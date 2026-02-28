package com.mocktest.dto.exam;

import java.time.LocalDateTime;

public class ExamResponse {

    private Long id;
    private String title;
    private String mediatorName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;

    public ExamResponse() {}

    public ExamResponse(Long id, String title, String mediatorName,
                        LocalDateTime startTime, LocalDateTime endTime,
                        Integer durationMinutes) {
        this.id = id;
        this.title = title;
        this.mediatorName = mediatorName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
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
}
