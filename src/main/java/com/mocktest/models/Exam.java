package com.mocktest.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a scheduled examination created by a Mediator.
 *
 * <p>Mapped to the <b>exams</b> table in PostgreSQL.
 * The {@code mediator_id} column is a foreign key to {@link User}.</p>
 */
@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    /**
     * The mediator (a User with role MEDIATOR) who created this exam.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mediator_id", nullable = false)
    private User mediator;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    /* ---------- Constructors ---------- */

    public Exam() {
        // Required by JPA
    }

    public Exam(String title, User mediator, LocalDateTime startTime,
                LocalDateTime endTime, Integer durationMinutes) {
        this.title = title;
        this.mediator = mediator;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
    }

    /* ---------- Getters & Setters ---------- */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public User getMediator() {
        return mediator;
    }

    public void setMediator(User mediator) {
        this.mediator = mediator;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}
