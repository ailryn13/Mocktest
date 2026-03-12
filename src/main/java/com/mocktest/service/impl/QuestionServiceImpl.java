package com.mocktest.service.impl;

import com.mocktest.dto.question.QuestionRequest;
import com.mocktest.dto.question.QuestionResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Exam;
import com.mocktest.models.Question;
import com.mocktest.models.User;
import com.mocktest.models.enums.QuestionType;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.QuestionRepository;
import com.mocktest.repositories.SubmissionRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    public QuestionServiceImpl(QuestionRepository questionRepository,
                               ExamRepository examRepository,
                               SubmissionRepository submissionRepository,
                               UserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.examRepository = examRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public QuestionResponse create(QuestionRequest request, String mediatorEmail) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Exam not found: " + request.getExamId()));

        User mediator = userRepository.findByEmail(mediatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (mediator.getDepartment() == null || exam.getMediator().getDepartment() == null ||
            !mediator.getDepartment().getId().equals(exam.getMediator().getDepartment().getId())) {
            throw new BadRequestException("You can only add questions to exams in your own department");
        }

        QuestionType type = QuestionType.valueOf(request.getType().toUpperCase());

        Question question = new Question(
                exam, type,
                request.getContent(),
                request.getOptions(),
                request.getCorrectAnswer(),
                request.getTestCases(),
                request.getMarks() != null ? request.getMarks() : 1,
                request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM");
        question.setLanguage(request.getLanguage());
        question.setBannedKeywords(request.getBannedKeywords());

        question = questionRepository.save(question);
        return toResponse(question, false);
    }

    @Override
    public List<QuestionResponse> getByExamId(Long examId, String mediatorEmail) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        
        User mediator = userRepository.findByEmail(mediatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (mediator.getDepartment() == null || exam.getMediator().getDepartment() == null ||
            !mediator.getDepartment().getId().equals(exam.getMediator().getDepartment().getId())) {
            throw new BadRequestException("You can only access questions in your own department");
        }

        return questionRepository.findByExamId(examId)
                .stream()
                .map(q -> toResponse(q, false))
                .collect(Collectors.toList());
    }

    @Override
    public List<QuestionResponse> getByExamIdForStudent(Long examId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (student.getDepartment() == null || exam.getMediator().getDepartment() == null ||
            !student.getDepartment().getId().equals(exam.getMediator().getDepartment().getId())) {
            throw new BadRequestException("You can only access exams in your own department");
        }

        if (submissionRepository.findByUserIdAndExamId(student.getId(), examId).isPresent()) {
            throw new BadRequestException("Exam already submitted or terminated due to violation.");
        }

        return questionRepository.findByExamId(examId)
                .stream()
                .map(q -> toResponse(q, true))   // strip answers
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QuestionResponse update(Long id, QuestionRequest request, String mediatorEmail) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + id));

        Exam exam = question.getExam();
        User mediator = userRepository.findByEmail(mediatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (mediator.getDepartment() == null || exam.getMediator().getDepartment() == null ||
            !mediator.getDepartment().getId().equals(exam.getMediator().getDepartment().getId())) {
            throw new BadRequestException("You can only update questions in your own department");
        }

        question.setType(QuestionType.valueOf(request.getType().toUpperCase()));
        question.setContent(request.getContent());
        question.setOptions(request.getOptions());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setTestCases(request.getTestCases());
        question.setMarks(request.getMarks() != null ? request.getMarks() : 1);
        question.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM");
        question.setLanguage(request.getLanguage());
        question.setBannedKeywords(request.getBannedKeywords());

        question = questionRepository.save(question);
        return toResponse(question, false);
    }

    @Override
    @Transactional
    public java.util.List<QuestionResponse> bulkCreate(java.util.List<QuestionRequest> requests, String mediatorEmail) {
        return requests.stream()
                .map(r -> this.create(r, mediatorEmail))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(Long id, String mediatorEmail) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + id));
        
        Exam exam = question.getExam();
        User mediator = userRepository.findByEmail(mediatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (mediator.getDepartment() == null || exam.getMediator().getDepartment() == null ||
            !mediator.getDepartment().getId().equals(exam.getMediator().getDepartment().getId())) {
            throw new BadRequestException("You can only delete questions in your own department");
        }

        questionRepository.delete(question);
    }

    /* ---- mapper ---- */

    private QuestionResponse toResponse(Question q, boolean hideAnswers) {
        QuestionResponse resp = new QuestionResponse(
                q.getId(),
                q.getExam().getId(),
                q.getType().name(),
                q.getContent(),
                q.getOptions(),
                hideAnswers ? null : q.getCorrectAnswer(),
                hideAnswers ? null : q.getTestCases(),
                q.getMarks(),
                q.getDifficulty(),
                q.getLanguage());
        resp.setBannedKeywords(q.getBannedKeywords());
        return resp;
    }
}
