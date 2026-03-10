package com.mocktest.dto.question;

public class QuestionResponse {

    private Long id;
    private Long examId;
    private String type;
    private String content;
    private String options;
    private String correctAnswer;
    private String testCases;
    private Integer marks;
    private String difficulty;
    private String language;
    private String bannedKeywords;

    public QuestionResponse() {}

    public QuestionResponse(Long id, Long examId, String type, String content,
                            String options, String correctAnswer, String testCases,
                            Integer marks, String difficulty) {
        this(id, examId, type, content, options, correctAnswer, testCases, marks, difficulty, null);
    }

    public QuestionResponse(Long id, Long examId, String type, String content,
                            String options, String correctAnswer, String testCases,
                            Integer marks, String difficulty, String language) {
        this.id = id;
        this.examId = examId;
        this.type = type;
        this.content = content;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.testCases = testCases;
        this.marks = marks;
        this.difficulty = difficulty;
        this.language = language;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getTestCases() { return testCases; }
    public void setTestCases(String testCases) { this.testCases = testCases; }

    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getBannedKeywords() { return bannedKeywords; }
    public void setBannedKeywords(String bannedKeywords) { this.bannedKeywords = bannedKeywords; }
}
