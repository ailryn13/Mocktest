package com.mocktest.service.impl;

import com.mocktest.dto.exam.ExamRequest;
import com.mocktest.dto.exam.ExamResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.models.Exam;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ExamServiceImplTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExamServiceImpl examService;

    private User mediator;
    private Exam testExam;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @BeforeEach
    void setUp() {
        Department dept = new Department("CS");
        dept.setId(1L);

        mediator = new User("Mediator", "mediator@test.com", "hash", Role.MEDIATOR, dept);
        mediator.setId(1L);

        startTime = LocalDateTime.of(2026, 3, 1, 10, 0);
        endTime = LocalDateTime.of(2026, 3, 1, 12, 0);

        testExam = new Exam("Java Basics", mediator, startTime, endTime, 120);
        testExam.setId(1L);
    }

    @Test
    void create_withValidRequest_returnsExamResponse() {
        // Arrange
        ExamRequest request = new ExamRequest();
        request.setTitle("Java Basics");
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setDurationMinutes(120);

        when(userRepository.findByEmail("mediator@test.com")).thenReturn(Optional.of(mediator));
        when(examRepository.save(any(Exam.class))).thenReturn(testExam);

        // Act
        ExamResponse response = examService.create(request, "mediator@test.com");

        // Assert
        assertEquals(1L, response.getId());
        assertEquals("Java Basics", response.getTitle());
        assertEquals("Mediator", response.getMediatorName());
        assertEquals(120, response.getDurationMinutes());
    }

    @Test
    void create_withNonExistentMediator_throwsResourceNotFoundException() {
        // Arrange
        ExamRequest request = new ExamRequest();
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> examService.create(request, "unknown@test.com"));
    }

    @Test
    void getByMediator_returnsMediatorExams() {
        // Arrange
        when(userRepository.findByEmail("mediator@test.com")).thenReturn(Optional.of(mediator));
        when(examRepository.findByMediatorId(1L)).thenReturn(Arrays.asList(testExam));

        // Act
        List<ExamResponse> result = examService.getByMediator("mediator@test.com");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Java Basics", result.get(0).getTitle());
    }

    @Test
    void getActiveExams_returnsActiveExams() {
        // Arrange
        when(examRepository.findByStartTimeBeforeAndEndTimeAfter(any(), any()))
                .thenReturn(Arrays.asList(testExam));

        // Act
        List<ExamResponse> result = examService.getActiveExams();

        // Assert
        assertEquals(1, result.size());
    }

    @Test
    void getActiveExams_returnsEmptyWhenNoActive() {
        // Arrange
        when(examRepository.findByStartTimeBeforeAndEndTimeAfter(any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        List<ExamResponse> result = examService.getActiveExams();

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void getById_withValidId_returnsExam() {
        // Arrange
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));

        // Act
        ExamResponse response = examService.getById(1L);

        // Assert
        assertEquals(1L, response.getId());
        assertEquals("Java Basics", response.getTitle());
    }

    @Test
    void getById_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> examService.getById(999L));
    }

    @Test
    void update_withValidOwner_updatesExam() {
        // Arrange
        ExamRequest request = new ExamRequest();
        request.setTitle("Updated Title");
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setDurationMinutes(90);

        Exam updatedExam = new Exam("Updated Title", mediator, startTime, endTime, 90);
        updatedExam.setId(1L);

        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));
        when(examRepository.save(any(Exam.class))).thenReturn(updatedExam);

        // Act
        ExamResponse response = examService.update(1L, request, "mediator@test.com");

        // Assert
        assertEquals("Updated Title", response.getTitle());
        assertEquals(90, response.getDurationMinutes());
    }

    @Test
    void update_withWrongOwner_throwsBadRequestException() {
        // Arrange
        ExamRequest request = new ExamRequest();
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));

        // Act & Assert
        assertThrows(BadRequestException.class,
                () -> examService.update(1L, request, "other@test.com"));
    }

    @Test
    void delete_withValidOwner_deletesExam() {
        // Arrange
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));

        // Act
        examService.delete(1L, "mediator@test.com");

        // Assert
        verify(examRepository).delete(testExam);
    }

    @Test
    void delete_withWrongOwner_throwsBadRequestException() {
        // Arrange
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));

        // Act & Assert
        assertThrows(BadRequestException.class,
                () -> examService.delete(1L, "other@test.com"));
        verify(examRepository, never()).delete(any());
    }

    @Test
    void delete_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> examService.delete(999L, "mediator@test.com"));
    }
}
