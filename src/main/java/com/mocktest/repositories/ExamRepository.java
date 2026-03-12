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

    /** All exams created by mediators in a specific department. */
    List<Exam> findByMediatorDepartmentId(Long departmentId);

    /** Exams whose window is currently active (start ≤ now ≤ end). */
    List<Exam> findByStartTimeBeforeAndEndTimeAfter(LocalDateTime now1, LocalDateTime now2);

    /** Active exams filtered by mediator's department. */
    List<Exam> findByStartTimeBeforeAndEndTimeAfterAndMediatorDepartmentId(
            LocalDateTime now1, LocalDateTime now2, Long departmentId);

    /** Exams that haven't ended yet. */
    List<Exam> findByEndTimeAfter(LocalDateTime now);

    /** Exams that haven't ended yet for a specific department. */
    List<Exam> findByEndTimeAfterAndMediatorDepartmentId(LocalDateTime now, Long departmentId);
}
