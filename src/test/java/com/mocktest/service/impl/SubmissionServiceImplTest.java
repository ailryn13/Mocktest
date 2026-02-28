package com.mocktest.service.impl;

import com.mocktest.dto.submission.SubmissionRequest;
import com.mocktest.dto.submission.SubmissionResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.*;
import com.mocktest.models.enums.QuestionType;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class SubmissionServiceImplTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private QuestionRepository questionRepository;

    @InjectMocks
    private SubmissionServiceImpl submissionService;

    private User student;
    private Exam exam;
    private Question mcqQuestion1;
    private Question mcqQuestion2;
    private Question codingQuestion;

    @BeforeEach
    void setUp() {
        Department dept = new Department("CS");
        dept.setId(1L);
        User mediator = new User("Med", "med@test.com", "hash", Role.MEDIATOR, dept);
        mediator.setId(1L);

        student = new User("Student", "student@test.com", "hash", Role.STUDENT, dept);
        student.setId(2L);

        exam = new Exam("Test Exam", mediator,
                LocalDateTime.of(2026, 3, 1, 10, 0),
                LocalDateTime.of(2026, 3, 1, 12, 0), 120);
        exam.setId(1L);

        mcqQuestion1 = new Question(exam, QuestionType.MCQ, "Q1", "A,B,C,D", "A", null);
        mcqQuestion1.setId(1L);

        mcqQuestion2 = new Question(exam, QuestionType.MCQ, "Q2", "A,B,C,D", "B", null);
        mcqQuestion2.setId(2L);

        codingQuestion = new Question(exam, QuestionType.CODING, "Write code", null, null, "test cases");
        codingQuestion.setId(3L);
    }

    @Test
    void submit_withAllCorrectMcqAnswers_returns100Percent() {
        // Arrange
        SubmissionRequest request = new SubmissionRequest();
        request.setExamId(1L);
        Map<Long, String> answers = new HashMap<>();
        answers.put(1L, "A");
        answers.put(2L, "B");
        request.setAnswers(answers);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.empty());
        when(questionRepository.findByExamId(1L)).thenReturn(Arrays.asList(mcqQuestion1, mcqQuestion2, codingQuestion));

        Submission savedSubmission = new Submission(student, exam, 100.0, LocalDateTime.now());
        savedSubmission.setId(1L);
        when(submissionRepository.save(any(Submission.class))).thenReturn(savedSubmission);

        // Act
        SubmissionResponse response = submissionService.submit(request, "student@test.com");

        // Assert
        assertNotNull(response);
        assertEquals(100.0, response.getScore());
    }

    @Test
    void submit_withNoCorrectAnswers_returns0Percent() {
        // Arrange
        SubmissionRequest request = new SubmissionRequest();
        request.setExamId(1L);
        Map<Long, String> answers = new HashMap<>();
        answers.put(1L, "C"); // wrong
        answers.put(2L, "D"); // wrong
        request.setAnswers(answers);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.empty());
        when(questionRepository.findByExamId(1L)).thenReturn(Arrays.asList(mcqQuestion1, mcqQuestion2));

        Submission savedSubmission = new Submission(student, exam, 0.0, LocalDateTime.now());
        savedSubmission.setId(1L);
        when(submissionRepository.save(any(Submission.class))).thenReturn(savedSubmission);

        // Act
        SubmissionResponse response = submissionService.submit(request, "student@test.com");

        // Assert
        assertNotNull(response);
        assertEquals(0.0, response.getScore());
    }

    @Test
    void submit_withPartialCorrectAnswers_returnsPartialScore() {
        // Arrange
        SubmissionRequest request = new SubmissionRequest();
        request.setExamId(1L);
        Map<Long, String> answers = new HashMap<>();
        answers.put(1L, "A"); // correct
        answers.put(2L, "D"); // wrong
        request.setAnswers(answers);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.empty());
        when(questionRepository.findByExamId(1L)).thenReturn(Arrays.asList(mcqQuestion1, mcqQuestion2));

        Submission savedSubmission = new Submission(student, exam, 50.0, LocalDateTime.now());
        savedSubmission.setId(1L);
        when(submissionRepository.save(any(Submission.class))).thenReturn(savedSubmission);

        // Act
        SubmissionResponse response = submissionService.submit(request, "student@test.com");

        // Assert
        assertNotNull(response);
        assertEquals(50.0, response.getScore());
    }

    @Test
    void submit_duplicateSubmission_throwsBadRequestException() {
        // Arrange
        SubmissionRequest request = new SubmissionRequest();
        request.setExamId(1L);
        request.setAnswers(new HashMap<>());

        Submission existingSubmission = new Submission(student, exam, 80.0, LocalDateTime.now());

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.of(existingSubmission));

        // Act & Assert
        assertThrows(BadRequestException.class,
                () -> submissionService.submit(request, "student@test.com"));
    }

    @Test
    void submit_withNonExistentUser_throwsResourceNotFoundException() {
        // Arrange
        SubmissionRequest request = new SubmissionRequest();
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> submissionService.submit(request, "unknown@test.com"));
    }

    @Test
    void submit_withNonExistentExam_throwsResourceNotFoundException() {
        // Arrange
        SubmissionRequest request = new SubmissionRequest();
        request.setExamId(999L);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> submissionService.submit(request, "student@test.com"));
    }

    @Test
    void submit_withOnlyCodingQuestions_returns0Score() {
        // Arrange: exam has only coding questions, no MCQs to grade
        SubmissionRequest request = new SubmissionRequest();
        request.setExamId(1L);
        request.setAnswers(new HashMap<>());

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.empty());
        when(questionRepository.findByExamId(1L)).thenReturn(Arrays.asList(codingQuestion));

        Submission savedSubmission = new Submission(student, exam, 0.0, LocalDateTime.now());
        savedSubmission.setId(1L);
        when(submissionRepository.save(any(Submission.class))).thenReturn(savedSubmission);

        // Act
        SubmissionResponse response = submissionService.submit(request, "student@test.com");

        // Assert
        assertEquals(0.0, response.getScore());
    }

    @Test
    void getByUserAndExam_withValidIds_returnsSubmission() {
        // Arrange
        Submission sub = new Submission(student, exam, 85.0, LocalDateTime.now());
        sub.setId(1L);
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.of(sub));

        // Act
        SubmissionResponse response = submissionService.getByUserAndExam(2L, 1L);

        // Assert
        assertEquals(85.0, response.getScore());
        assertEquals("Student", response.getUserName());
    }

    @Test
    void getByUserAndExam_withInvalidIds_throwsResourceNotFoundException() {
        // Arrange
        when(submissionRepository.findByUserIdAndExamId(999L, 999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> submissionService.getByUserAndExam(999L, 999L));
    }

    @Test
    void getByExamId_returnsList() {
        // Arrange
        Submission sub = new Submission(student, exam, 75.0, LocalDateTime.now());
        sub.setId(1L);
        when(submissionRepository.findByExamId(1L)).thenReturn(Arrays.asList(sub));

        // Act
        List<SubmissionResponse> result = submissionService.getByExamId(1L);

        // Assert
        assertEquals(1, result.size());
    }

    @Test
    void getByUserId_returnsList() {
        // Arrange
        Submission sub = new Submission(student, exam, 90.0, LocalDateTime.now());
        sub.setId(1L);
        when(submissionRepository.findByUserId(2L)).thenReturn(Arrays.asList(sub));

        // Act
        List<SubmissionResponse> result = submissionService.getByUserId(2L);

        // Assert
        assertEquals(1, result.size());
        assertEquals(90.0, result.get(0).getScore());
    }
}
