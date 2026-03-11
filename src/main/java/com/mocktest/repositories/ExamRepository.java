package com.mocktest.repositories;

import com.mocktest.models.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    /** All exams created by a particular mediator. */
    List<Exam> findByMediatorId(Long mediatorId);

    /** Exams whose window is currently active (start ≤ now ≤ end). */
    List<Exam> findByStartTimeBeforeAndEndTimeAfter(LocalDateTime now1, LocalDateTime now2);

    /** Active exams filtered by mediator's department. */
    List<Exam> findByStartTimeBeforeAndEndTimeAfterAndMediatorDepartmentId(
            LocalDateTime now1, LocalDateTime now2, Long departmentId);
}
