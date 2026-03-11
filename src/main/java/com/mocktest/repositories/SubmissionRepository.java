package com.mocktest.repositories;

import com.mocktest.models.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    /** All submissions a student has ever made. */
    List<Submission> findByUserId(Long userId);

    /** All submissions for a given exam (useful for grading reports). */
    List<Submission> findByExamId(Long examId);

    /** The unique submission for a specific student + exam pair. */
    Optional<Submission> findByUserIdAndExamId(Long userId, Long examId);
}
