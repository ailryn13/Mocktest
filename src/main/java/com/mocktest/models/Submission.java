package com.mocktest.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Captures a student's completed exam attempt along with the computed score.
 *
 * <p>Mapped to the <b>submissions</b> table in PostgreSQL.
 * Foreign keys point to {@link User} (student) and {@link Exam}.</p>
 */
@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The student who submitted the exam.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The exam that was submitted.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    private Double score;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /* ---------- Constructors ---------- */

    public Submission() {
        // Required by JPA
    }

    public Submission(User user, Exam exam, Double score, LocalDateTime submittedAt) {
        this.user = user;
        this.exam = exam;
        this.score = score;
        this.submittedAt = submittedAt;
    }

    /* ---------- Getters & Setters ---------- */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
