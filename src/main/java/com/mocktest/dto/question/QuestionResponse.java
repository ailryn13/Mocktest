package com.mocktest.dto.question;

public class QuestionResponse {

    private Long id;
    private Long examId;
    private String type;
    private String content;
    private String options;      // JSON – shown to students for MCQ
    private String correctAnswer; // hidden from students at runtime
    private String testCases;     // hidden from students at runtime

    public QuestionResponse() {}

    public QuestionResponse(Long id, Long examId, String type, String content,
                            String options, String correctAnswer, String testCases) {
        this.id = id;
        this.examId = examId;
        this.type = type;
        this.content = content;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.testCases = testCases;
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
}
