package com.mocktest.service.impl;

import com.mocktest.dto.malpractice.MalpracticeLogRequest;
import com.mocktest.dto.malpractice.MalpracticeLogResponse;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.*;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.MalpracticeLogRepository;
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
class MalpracticeServiceImplTest {

    @Mock
    private MalpracticeLogRepository malpracticeLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExamRepository examRepository;

    @InjectMocks
    private MalpracticeServiceImpl malpracticeService;

    private User student;
    private Exam exam;

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
    }

    @Test
    void logViolation_withValidRequest_returnsResponse() {
        // Arrange
        MalpracticeLogRequest request = new MalpracticeLogRequest();
        request.setExamId(1L);
        request.setViolationType("TAB_SWITCH");

        MalpracticeLog savedLog = new MalpracticeLog(student, exam, "TAB_SWITCH", LocalDateTime.now());
        savedLog.setId(1L);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(malpracticeLogRepository.save(any(MalpracticeLog.class))).thenReturn(savedLog);
        when(malpracticeLogRepository.countByUserIdAndExamId(2L, 1L)).thenReturn(1L);

        // Act
        MalpracticeLogResponse response = malpracticeService.logViolation(request, "student@test.com");

        // Assert
        assertEquals(1L, response.getId());
        assertEquals(2L, response.getUserId());
        assertEquals("TAB_SWITCH", response.getViolationType());
        assertEquals(1L, response.getTotalViolations());
    }

    @Test
    void logViolation_withNonExistentUser_throwsResourceNotFoundException() {
        // Arrange
        MalpracticeLogRequest request = new MalpracticeLogRequest();
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> malpracticeService.logViolation(request, "unknown@test.com"));
    }

    @Test
    void logViolation_withNonExistentExam_throwsResourceNotFoundException() {
        // Arrange
        MalpracticeLogRequest request = new MalpracticeLogRequest();
        request.setExamId(999L);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> malpracticeService.logViolation(request, "student@test.com"));
    }

    @Test
    void getByUserAndExam_returnsList() {
        // Arrange
        MalpracticeLog log = new MalpracticeLog(student, exam, "TAB_SWITCH", LocalDateTime.now());
        log.setId(1L);

        when(malpracticeLogRepository.countByUserIdAndExamId(2L, 1L)).thenReturn(1L);
        when(malpracticeLogRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Arrays.asList(log));

        // Act
        List<MalpracticeLogResponse> result = malpracticeService.getByUserAndExam(2L, 1L);

        // Assert
        assertEquals(1, result.size());
        assertEquals("TAB_SWITCH", result.get(0).getViolationType());
        assertEquals(1L, result.get(0).getTotalViolations());
    }

    @Test
    void getByUserAndExam_returnsEmptyList() {
        // Arrange
        when(malpracticeLogRepository.countByUserIdAndExamId(2L, 1L)).thenReturn(0L);
        when(malpracticeLogRepository.findByUserIdAndExamId(2L, 1L)).thenReturn(Collections.emptyList());

        // Act
        List<MalpracticeLogResponse> result = malpracticeService.getByUserAndExam(2L, 1L);

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void getByExam_returnsList() {
        // Arrange
        MalpracticeLog log1 = new MalpracticeLog(student, exam, "TAB_SWITCH", LocalDateTime.now());
        log1.setId(1L);
        MalpracticeLog log2 = new MalpracticeLog(student, exam, "COPY_PASTE", LocalDateTime.now());
        log2.setId(2L);

        when(malpracticeLogRepository.findByExamId(1L)).thenReturn(Arrays.asList(log1, log2));
        when(malpracticeLogRepository.countByUserIdAndExamId(2L, 1L)).thenReturn(2L);

        // Act
        List<MalpracticeLogResponse> result = malpracticeService.getByExam(1L);

        // Assert
        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).getTotalViolations());
    }
}
