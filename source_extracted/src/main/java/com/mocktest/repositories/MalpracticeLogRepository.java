package com.mocktest.repositories;

import com.mocktest.models.MalpracticeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MalpracticeLogRepository extends JpaRepository<MalpracticeLog, Long> {

    /** All violation events recorded for a student in a specific exam. */
    List<MalpracticeLog> findByUserIdAndExamId(Long userId, Long examId);

    /** Count violations to decide whether the threshold has been exceeded. */
    long countByUserIdAndExamId(Long userId, Long examId);

    /** All violations logged during a particular exam (for mediator review). */
    List<MalpracticeLog> findByExamId(Long examId);
}
