package com.mocktest.service.impl;

import com.mocktest.dto.question.QuestionRequest;
import com.mocktest.dto.question.QuestionResponse;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Exam;
import com.mocktest.models.Question;
import com.mocktest.models.enums.QuestionType;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.QuestionRepository;
import com.mocktest.service.QuestionService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

    public QuestionServiceImpl(QuestionRepository questionRepository,
                               ExamRepository examRepository) {
        this.questionRepository = questionRepository;
        this.examRepository = examRepository;
    }

    @Override
    public QuestionResponse create(QuestionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Exam not found: " + request.getExamId()));

        QuestionType type = QuestionType.valueOf(request.getType().toUpperCase());

        Question question = new Question(
                exam, type,
                request.getContent(),
                request.getOptions(),
                request.getCorrectAnswer(),
                request.getTestCases());

        question = questionRepository.save(question);
        return toResponse(question, false);
    }

    @Override
    public List<QuestionResponse> getByExamId(Long examId) {
        return questionRepository.findByExamId(examId)
                .stream()
                .map(q -> toResponse(q, false))
                .collect(Collectors.toList());
    }

    @Override
    public List<QuestionResponse> getByExamIdForStudent(Long examId) {
        return questionRepository.findByExamId(examId)
                .stream()
                .map(q -> toResponse(q, true))   // strip answers
                .collect(Collectors.toList());
    }

    @Override
    public QuestionResponse update(Long id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + id));

        question.setType(QuestionType.valueOf(request.getType().toUpperCase()));
        question.setContent(request.getContent());
        question.setOptions(request.getOptions());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setTestCases(request.getTestCases());

        question = questionRepository.save(question);
        return toResponse(question, false);
    }

    @Override
    public void delete(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question not found: " + id);
        }
        questionRepository.deleteById(id);
    }

    /* ---- mapper ---- */

    private QuestionResponse toResponse(Question q, boolean hideAnswers) {
        return new QuestionResponse(
                q.getId(),
                q.getExam().getId(),
                q.getType().name(),
                q.getContent(),
                q.getOptions(),
                hideAnswers ? null : q.getCorrectAnswer(),
                hideAnswers ? null : q.getTestCases());
    }
}
