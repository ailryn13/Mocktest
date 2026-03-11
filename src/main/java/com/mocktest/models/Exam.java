package com.mocktest.models;

import com.mocktest.models.enums.ExamType;
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

    /**
     * MCQ-only, CODING-only, or HYBRID (mixed). Defaults to MCQ.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'MCQ'")
    private ExamType examType = ExamType.MCQ;

    // ── Coding Constraints ────────────────────────────────────────────
    /** Comma-separated list of allowed submission languages, e.g. "Java,Python" */
    @Column(name = "allowed_languages", length = 200)
    private String allowedLanguages;

    /** Comma-separated banned keywords, e.g. "for,while,sort" */
    @Column(name = "banned_keywords", length = 500)
    private String bannedKeywords;

    @Column(name = "must_use_recursion")
    private Boolean mustUseRecursion = false;

    @Column(name = "must_use_oop")
    private Boolean mustUseOOP = false;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds = 5;

    @Column(name = "memory_limit_mb")
    private Integer memoryLimitMb = 256;

    /* ---------- Constructors ---------- */

    public Exam() {
        // Required by JPA
    }

    /** Backward-compatible constructor (tests + legacy code). */
    public Exam(String title, User mediator, LocalDateTime startTime,
                LocalDateTime endTime, Integer durationMinutes) {
        this(title, mediator, startTime, endTime, durationMinutes, ExamType.MCQ);
    }

    public Exam(String title, User mediator, LocalDateTime startTime,
                LocalDateTime endTime, Integer durationMinutes, ExamType examType) {
        this.title = title;
        this.mediator = mediator;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMinutes = durationMinutes;
        this.examType = examType != null ? examType : ExamType.MCQ;
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

    public ExamType getExamType() {
        return examType;
    }

    public void setExamType(ExamType examType) {
        this.examType = examType;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(String allowedLanguages) { this.allowedLanguages = allowedLanguages; }

    public String getBannedKeywords() { return bannedKeywords; }
    public void setBannedKeywords(String bannedKeywords) { this.bannedKeywords = bannedKeywords; }

    public Boolean getMustUseRecursion() { return mustUseRecursion; }
    public void setMustUseRecursion(Boolean mustUseRecursion) { this.mustUseRecursion = mustUseRecursion; }

    public Boolean getMustUseOOP() { return mustUseOOP; }
    public void setMustUseOOP(Boolean mustUseOOP) { this.mustUseOOP = mustUseOOP; }

    public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }

    public Integer getMemoryLimitMb() { return memoryLimitMb; }
    public void setMemoryLimitMb(Integer memoryLimitMb) { this.memoryLimitMb = memoryLimitMb; }
}
