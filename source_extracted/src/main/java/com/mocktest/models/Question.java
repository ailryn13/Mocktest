package com.mocktest.models;

import com.mocktest.models.enums.QuestionType;
import jakarta.persistence.*;

/**
 * Represents a single question inside an exam – either an MCQ or a Coding challenge.
 *
 * <p>Mapped to the <b>questions</b> table in PostgreSQL.
 * The {@code exam_id} column is a foreign key to {@link Exam}.</p>
 *
 * <h3>JSON columns</h3>
 * <ul>
 *   <li><b>options</b> – stores MCQ answer choices as a JSON string
 *       (e.g. {@code {"A":"Option 1","B":"Option 2"}}). Null for CODING questions.</li>
 *   <li><b>testCases</b> – stores hidden test-case data as a JSON string
 *       (e.g. {@code [{"input":"5","expected":"25"}]}). Null for MCQ questions.</li>
 * </ul>
 *
 * <p>PostgreSQL's {@code TEXT} type is used for the potentially large columns
 * ({@code content}, {@code options}, {@code test_cases}).</p>
 */
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The exam this question belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    /**
     * MCQ or CODING – stored as a VARCHAR via {@code EnumType.STRING}.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    /**
     * The question body / problem statement. Stored as TEXT to allow long descriptions.
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    /**
     * JSON string that holds the MCQ options.
     * Example: {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}
     */
    @Column(columnDefinition = "TEXT")
    private String options;

    /**
     * The correct answer key (e.g. "A") for MCQs, or a reference solution for coding.
     */
    @Column(name = "correct_answer")
    private String correctAnswer;

    /**
     * JSON string that holds hidden test cases for coding questions.
     * Example: [{"input": "5 3", "expected": "8"}, {"input": "10 20", "expected": "30"}]
     */
    @Column(name = "test_cases", columnDefinition = "TEXT")
    private String testCases;

    /** Marks awarded for a correct answer (default 1). */
    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 1")
    private Integer marks = 1;

    /** Difficulty tier: EASY, MEDIUM, HARD (used for Smart Phase ordering). */
    @Column(nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'MEDIUM'")
    private String difficulty = "MEDIUM";

    /**
     * For CODING questions: the programming language this question targets,
     * e.g. "java", "python", "cpp", "javascript". Null / blank = any language.
     */
    @Column(name = "language", length = 30)
    private String language;

    /**
     * For CODING questions: comma-separated banned keywords specific to this question,
     * e.g. "for,while,import". Overrides / supplements exam-level banned keywords.
     * Null means no question-level restrictions (exam-level apply if set).
     */
    @Column(name = "banned_keywords", length = 500)
    private String bannedKeywords;

    /* ---------- Constructors ---------- */

    public Question() {
        // Required by JPA
    }

    /** Backward-compatible constructor (tests + legacy code). */
    public Question(Exam exam, QuestionType type, String content,
                    String options, String correctAnswer, String testCases) {
        this(exam, type, content, options, correctAnswer, testCases, 1, "MEDIUM");
    }

    public Question(Exam exam, QuestionType type, String content,
                    String options, String correctAnswer, String testCases,
                    Integer marks, String difficulty) {
        this.exam = exam;
        this.type = type;
        this.content = content;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.testCases = testCases;
        this.marks = marks != null ? marks : 1;
        this.difficulty = difficulty != null ? difficulty : "MEDIUM";
    }

    /* ---------- Getters & Setters ---------- */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getOptions() {
        return options;
    }

    public void setOptions(String options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public String getTestCases() {
        return testCases;
    }

    public void setTestCases(String testCases) {
        this.testCases = testCases;
    }

    public Integer getMarks() {
        return marks;
    }

    public void setMarks(Integer marks) {
        this.marks = marks;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getBannedKeywords() {
        return bannedKeywords;
    }

    public void setBannedKeywords(String bannedKeywords) {
        this.bannedKeywords = bannedKeywords;
    }
}
