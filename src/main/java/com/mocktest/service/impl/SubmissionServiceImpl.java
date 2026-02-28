package com.mocktest.service.impl;

import com.mocktest.dto.submission.SubmissionRequest;
import com.mocktest.dto.submission.SubmissionResponse;
import com.mocktest.dto.code.CodeExecutionResult;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.*;
import com.mocktest.models.enums.QuestionType;
import com.mocktest.repositories.*;
import com.mocktest.service.CodeExecutionService;
import com.mocktest.service.SubmissionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Handles exam submission, auto-grading for MCQs, and score persistence.
 * Coding questions are scored as 0 here – a real implementation would
 * delegate to a sandboxed code-execution engine (e.g. Judge0).
 */
@Service
@SuppressWarnings("null")
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final CodeExecutionService codeExecutionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SubmissionServiceImpl(SubmissionRepository submissionRepository,
                                 UserRepository userRepository,
                                 ExamRepository examRepository,
                                 QuestionRepository questionRepository,
                                 CodeExecutionService codeExecutionService) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.codeExecutionService = codeExecutionService;
    }

    @Override
    @Transactional
    public SubmissionResponse submit(SubmissionRequest request, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Exam not found: " + request.getExamId()));

        // Prevent duplicate submissions
        if (submissionRepository.findByUserIdAndExamId(student.getId(), exam.getId()).isPresent()) {
            throw new BadRequestException("You have already submitted this exam");
        }

        // Auto-grade MCQ questions
        List<Question> questions = questionRepository.findByExamId(exam.getId());
        Map<Long, String> answers = request.getAnswers();

        double totalScore = 0;
        int gradableCount = 0;

        for (Question q : questions) {
            if (q.getType() == QuestionType.MCQ) {
                gradableCount++;
                String studentAnswer = answers.get(q.getId());
                if (studentAnswer != null
                        && studentAnswer.trim().equalsIgnoreCase(q.getCorrectAnswer().trim())) {
                    totalScore += 1;
                }
            } else if (q.getType() == QuestionType.CODING) {
                gradableCount++;
                String studentCode = answers.get(q.getId());
                if (studentCode != null && q.getTestCases() != null) {
                    totalScore += gradeCodingQuestion(studentCode, q);
                }
            }
        }

        double percentageScore = gradableCount > 0
                ? (totalScore / gradableCount) * 100.0
                : 0.0;

        Submission submission = new Submission(
                student, exam, percentageScore, LocalDateTime.now());
        submission = submissionRepository.save(submission);

        return toResponse(submission);
    }

    @Override
    public SubmissionResponse getByUserAndExam(Long userId, Long examId) {
        Submission sub = submissionRepository.findByUserIdAndExamId(userId, examId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No submission found for user " + userId + " / exam " + examId));
        return toResponse(sub);
    }

    @Override
    public List<SubmissionResponse> getByExamId(Long examId) {
        return submissionRepository.findByExamId(examId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<SubmissionResponse> getByUserId(Long userId) {
        return submissionRepository.findByUserId(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /* ---- mapper ---- */

    private SubmissionResponse toResponse(Submission s) {
        return new SubmissionResponse(
                s.getId(),
                s.getUser().getId(),
                s.getUser().getName(),
                s.getExam().getId(),
                s.getExam().getTitle(),
                s.getScore(),
                s.getSubmittedAt());
    }

    /**
     * Grade a coding question by running the student's code against each hidden
     * test case via the Judge0 sandbox.  Returns a score between 0.0 and 1.0
     * representing the fraction of test cases passed.
     * <p>
     * The student answer for coding questions is expected as a JSON object:
     * {@code {"code": "...", "language": "java"}}
     */
    private double gradeCodingQuestion(String studentAnswer, Question question) {
        try {
            // Parse the student's answer – expects {"code": "...", "language": "java"}
            Map<String, String> answerMap = objectMapper.readValue(
                    studentAnswer, new TypeReference<>() {});

            String code = answerMap.get("code");
            String language = answerMap.getOrDefault("language", "python");

            if (code == null || code.isBlank()) return 0.0;

            // Parse hidden test cases – expects [{"input":"...","expected":"..."}]
            List<Map<String, String>> testCases = objectMapper.readValue(
                    question.getTestCases(), new TypeReference<>() {});

            if (testCases.isEmpty()) return 0.0;

            int passed = 0;
            for (Map<String, String> tc : testCases) {
                String input = tc.getOrDefault("input", "");
                String expected = tc.getOrDefault("expected", "").trim();

                CodeExecutionResult result = codeExecutionService.execute(code, language, input);

                String actual = result.getActualOutput() != null
                        ? result.getActualOutput().trim() : "";

                if (actual.equals(expected)) {
                    passed++;
                }
            }

            return (double) passed / testCases.size();

        } catch (Exception e) {
            // If parsing or execution fails, score is 0
            return 0.0;
        }
    }
}
