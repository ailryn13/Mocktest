package com.mocktest.service.impl;

import com.mocktest.dto.exam.ExamRequest;
import com.mocktest.dto.exam.ExamResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Exam;
import com.mocktest.models.User;
import com.mocktest.models.enums.ExamType;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.ExamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class ExamServiceImpl implements ExamService {

    private static final Logger log = LoggerFactory.getLogger(ExamServiceImpl.class);

    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public ExamServiceImpl(ExamRepository examRepository, UserRepository userRepository) {
        this.examRepository = examRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ExamResponse create(ExamRequest request, String mediatorEmail) {
        User mediator = findUserByEmail(mediatorEmail);
        ExamType examType = parseExamType(request.getExamType());
        Exam exam = new Exam(
                request.getTitle(),
                mediator,
                request.getStartTime(),
                request.getEndTime(),
                request.getDurationMinutes(),
                examType);
        applyConstraints(exam, request);
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
        LocalDateTime now = LocalDateTime.now();

        log.info("[DEBUG] Fetching exams for student: {} (DeptID: {}). Server Time: {}", studentEmail, deptId, now);

        // Fetch all exams that haven't ended yet (includes upcoming)
        List<Exam> exams = examRepository.findByEndTimeAfter(now);
        log.info("[DEBUG] Found {} exams that haven't ended yet.", exams.size());

        if (deptId == null) {
            log.warn("[DEBUG] Student {} has NO department. Returning empty list.", studentEmail);
            return List.of();
        }

        // Return list filtered by matching department
        return exams.stream()
                .peek(e -> {
                    Long medDeptId = (e.getMediator().getDepartment() != null) ? e.getMediator().getDepartment().getId() : null;
                    log.info("[DEBUG] Check Exam '{}' (ID: {}). Mediator Dept: {}. Match student Dept ({}): {}", 
                        e.getTitle(), e.getId(), medDeptId, deptId, (deptId != null && deptId.equals(medDeptId)));
                })
                .filter(e -> e.getMediator().getDepartment() != null && e.getMediator().getDepartment().getId().equals(deptId))
                .map(this::toResponse)
                .collect(Collectors.toList());
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
        exam.setExamType(parseExamType(request.getExamType()));
        applyConstraints(exam, request);
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
        ExamResponse res = new ExamResponse(
                exam.getId(),
                exam.getTitle(),
                exam.getMediator().getName(),
                exam.getStartTime(),
                exam.getEndTime(),
                exam.getDurationMinutes(),
                exam.getExamType() != null ? exam.getExamType().name() : "MCQ");
        // Coding constraints
        if (exam.getAllowedLanguages() != null && !exam.getAllowedLanguages().isBlank()) {
            res.setAllowedLanguages(java.util.Arrays.asList(exam.getAllowedLanguages().split(",")));
        }
        if (exam.getBannedKeywords() != null && !exam.getBannedKeywords().isBlank()) {
            res.setBannedKeywords(java.util.Arrays.asList(exam.getBannedKeywords().split(",")));
        }
        res.setMustUseRecursion(Boolean.TRUE.equals(exam.getMustUseRecursion()));
        res.setMustUseOOP(Boolean.TRUE.equals(exam.getMustUseOOP()));
        res.setTimeLimitSeconds(exam.getTimeLimitSeconds() != null ? exam.getTimeLimitSeconds() : 5);
        res.setMemoryLimitMb(exam.getMemoryLimitMb() != null ? exam.getMemoryLimitMb() : 256);
        return res;
    }

    /** Copy coding-constraint fields from DTO → entity (shared by create & update). */
    private void applyConstraints(Exam exam, ExamRequest req) {
        java.util.List<String> langs = req.getAllowedLanguages();
        exam.setAllowedLanguages(langs != null && !langs.isEmpty() ? String.join(",", langs) : null);
        java.util.List<String> kw = req.getBannedKeywords();
        exam.setBannedKeywords(kw != null && !kw.isEmpty() ? String.join(",", kw) : null);
        exam.setMustUseRecursion(req.getMustUseRecursion());
        exam.setMustUseOOP(req.getMustUseOOP());
        exam.setTimeLimitSeconds(req.getTimeLimitSeconds());
        exam.setMemoryLimitMb(req.getMemoryLimitMb());
    }

    private ExamType parseExamType(String raw) {
        if (raw == null || raw.isBlank()) return ExamType.MCQ;
        try { return ExamType.valueOf(raw.toUpperCase()); }
        catch (IllegalArgumentException e) { return ExamType.MCQ; }
    }
}
