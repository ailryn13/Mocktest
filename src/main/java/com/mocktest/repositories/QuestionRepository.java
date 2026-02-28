package com.mocktest.repositories;

import com.mocktest.models.Question;
import com.mocktest.models.enums.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /** All questions belonging to a specific exam. */
    List<Question> findByExamId(Long examId);

    /** Filter questions in an exam by type (MCQ or CODING). */
    List<Question> findByExamIdAndType(Long examId, QuestionType type);
}
