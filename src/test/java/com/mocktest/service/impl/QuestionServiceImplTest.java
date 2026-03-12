package com.mocktest.service.impl;

import com.mocktest.dto.question.QuestionRequest;
import com.mocktest.dto.question.QuestionResponse;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.models.Exam;
import com.mocktest.models.Question;
import com.mocktest.models.User;
import com.mocktest.models.enums.QuestionType;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.QuestionRepository;
import com.mocktest.repositories.SubmissionRepository;
import com.mocktest.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class QuestionServiceImplTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private QuestionServiceImpl questionService;

    private Exam testExam;
    private Question testQuestion;

    @BeforeEach
    void setUp() {
        Department dept = new Department("CS");
        dept.setId(1L);
        User mediator = new User("Med", "med@test.com", "hash", Role.MEDIATOR, dept);
        mediator.setId(1L);

        testExam = new Exam("Test Exam", mediator,
                LocalDateTime.of(2026, 3, 1, 10, 0),
                LocalDateTime.of(2026, 3, 1, 12, 0), 120);
        testExam.setId(1L);

        testQuestion = new Question(testExam, QuestionType.MCQ,
                "What is Java?", "A,B,C,D", "A", null);
        testQuestion.setId(1L);
    }

    private User createStudent() {
        User student = new User("Student", "student@test.com", "hash", Role.STUDENT, null);
        student.setId(2L);
        return student;
    }

    @Test
    void create_withValidRequest_returnsQuestionResponse() {
        // Arrange
        QuestionRequest request = new QuestionRequest();
        request.setExamId(1L);
        request.setType("MCQ");
        request.setContent("What is Java?");
        request.setOptions("A,B,C,D");
        request.setCorrectAnswer("A");

        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));
        when(questionRepository.save(any(Question.class))).thenReturn(testQuestion);

        // Act
        QuestionResponse response = questionService.create(request, "med@test.com");

        // Assert
        assertEquals(1L, response.getId());
        assertEquals(1L, response.getExamId());
        assertEquals("MCQ", response.getType());
        assertEquals("What is Java?", response.getContent());
        // Answer should be visible (not hidden)
        assertEquals("A", response.getCorrectAnswer());
    }

    @Test
    void create_withInvalidExam_throwsResourceNotFoundException() {
        // Arrange
        QuestionRequest request = new QuestionRequest();
        request.setExamId(999L);

        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> questionService.create(request, "med@test.com"));
    }

    @Test
    void getByExamId_returnsQuestionsWithAnswers() {
        // Arrange
        when(questionRepository.findByExamId(1L)).thenReturn(Arrays.asList(testQuestion));

        // Act
        List<QuestionResponse> result = questionService.getByExamId(1L, "med@test.com");

        // Assert
        assertEquals(1, result.size());
        // Answers should be visible for mediator view
        assertNotNull(result.get(0).getCorrectAnswer());
    }

    @Test
    void getByExamIdForStudent_hidesAnswers() {
        // Arrange
        User student = createStudent();
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(submissionRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Optional.empty());
        when(questionRepository.findByExamId(1L)).thenReturn(Arrays.asList(testQuestion));

        // Act
        List<QuestionResponse> result = questionService.getByExamIdForStudent(1L, "student@test.com");

        // Assert
        assertEquals(1, result.size());
        // Answers should be hidden for student view
        assertNull(result.get(0).getCorrectAnswer());
        assertNull(result.get(0).getTestCases());
    }

    @Test
    void update_withValidId_updatesQuestion() {
        // Arrange
        QuestionRequest request = new QuestionRequest();
        request.setType("CODING");
        request.setContent("Write a function");
        request.setOptions(null);
        request.setCorrectAnswer(null);
        request.setTestCases("input:1;output:1");

        Question updated = new Question(testExam, QuestionType.CODING,
                "Write a function", null, null, "input:1;output:1");
        updated.setId(1L);

        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(questionRepository.save(any(Question.class))).thenReturn(updated);

        // Act
        QuestionResponse response = questionService.update(1L, request, "med@test.com");

        // Assert
        assertEquals("CODING", response.getType());
        assertEquals("Write a function", response.getContent());
    }

    @Test
    void update_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        QuestionRequest request = new QuestionRequest();
        request.setType("MCQ");
        when(questionRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> questionService.update(999L, request, "med@test.com"));
    }

    @Test
    void delete_withValidId_deletesSuccessfully() {
        // Arrange
        when(questionRepository.existsById(1L)).thenReturn(true);

        // Act
        questionService.delete(1L, "med@test.com");

        // Assert
        verify(questionRepository).deleteById(1L);
    }

    @Test
    void delete_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        when(questionRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> questionService.delete(999L, "med@test.com"));
    }
}
