package com.mocktest.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Records every anti-malpractice event detected during a live exam session
 * (e.g. tab switch, window blur, exiting full-screen).
 *
 * <p>Mapped to the <b>malpractice_logs</b> table in PostgreSQL.
 * Foreign keys point to {@link User} and {@link Exam}.</p>
 */
@Entity
@Table(name = "malpractice_logs")
public class MalpracticeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The student whose behaviour triggered the violation.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The exam during which the violation occurred.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "violation_type", nullable = false)
    private String violationType;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    /* ---------- Constructors ---------- */

    public MalpracticeLog() {
        // Required by JPA
    }

    public MalpracticeLog(User user, Exam exam, String violationType, LocalDateTime timestamp) {
        this.user = user;
        this.exam = exam;
        this.violationType = violationType;
        this.timestamp = timestamp;
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

    public String getViolationType() {
        return violationType;
    }

    public void setViolationType(String violationType) {
        this.violationType = violationType;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
