package com.mocktest.service.impl;

import com.mocktest.dto.exam.ExamRequest;
import com.mocktest.dto.exam.ExamResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Exam;
import com.mocktest.models.User;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.ExamService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public ExamServiceImpl(ExamRepository examRepository, UserRepository userRepository) {
        this.examRepository = examRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ExamResponse create(ExamRequest request, String mediatorEmail) {
        User mediator = findUserByEmail(mediatorEmail);
        Exam exam = new Exam(
                request.getTitle(),
                mediator,
                request.getStartTime(),
                request.getEndTime(),
                request.getDurationMinutes());
        exam = examRepository.save(exam);
        return toResponse(exam);
    }

    @Override
    public List<ExamResponse> getByMediator(String mediatorEmail) {
        User mediator = findUserByEmail(mediatorEmail);
        return examRepository.findByMediatorId(mediator.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ExamResponse> getActiveExams() {
        LocalDateTime now = LocalDateTime.now();
        return examRepository.findByStartTimeBeforeAndEndTimeAfter(now, now)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ExamResponse> getActiveExamsForStudent(String studentEmail) {
        User student = findUserByEmail(studentEmail);
        Long deptId = student.getDepartment() != null ? student.getDepartment().getId() : null;
        if (deptId == null) {
            return List.of(); // student without department sees no exams
        }
        LocalDateTime now = LocalDateTime.now();
        return examRepository
                .findByStartTimeBeforeAndEndTimeAfterAndMediatorDepartmentId(now, now, deptId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ExamResponse getById(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
        return toResponse(exam);
    }

    @Override
    public ExamResponse update(Long id, ExamRequest request, String mediatorEmail) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));

        if (!exam.getMediator().getEmail().equals(mediatorEmail)) {
            throw new BadRequestException("You can only update your own exams");
        }

        exam.setTitle(request.getTitle());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam = examRepository.save(exam);
        return toResponse(exam);
    }

    @Override
    public void delete(Long id, String mediatorEmail) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));

        if (!exam.getMediator().getEmail().equals(mediatorEmail)) {
            throw new BadRequestException("You can only delete your own exams");
        }
        examRepository.delete(exam);
    }

    /* ---- helpers ---- */

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private ExamResponse toResponse(Exam exam) {
        return new ExamResponse(
                exam.getId(),
                exam.getTitle(),
                exam.getMediator().getName(),
                exam.getStartTime(),
                exam.getEndTime(),
                exam.getDurationMinutes());
    }
}
