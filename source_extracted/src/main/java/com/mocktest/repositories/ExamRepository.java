package com.mocktest.repositories;

import com.mocktest.models.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    /** All exams created by mediators in a specific department (optimized). */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Exam e JOIN FETCH e.mediator WHERE e.mediator.department.id = :departmentId")
    List<Exam> findByMediatorDepartmentId(@org.springframework.data.repository.query.Param("departmentId") Long departmentId);

    /** All exams created by a particular mediator (optimized). */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Exam e JOIN FETCH e.mediator WHERE e.mediator.id = :mediatorId")
    List<Exam> findByMediatorId(@org.springframework.data.repository.query.Param("mediatorId") Long mediatorId);

    /** Exams whose window is currently active (start ≤ now ≤ end) with mediator pre-loaded. */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Exam e JOIN FETCH e.mediator WHERE e.startTime <= :now1 AND e.endTime >= :now2")
    List<Exam> findByStartTimeBeforeAndEndTimeAfter(@org.springframework.data.repository.query.Param("now1") LocalDateTime now1, @org.springframework.data.repository.query.Param("now2") LocalDateTime now2);

    /** Active exams filtered by mediator's department (optimized). */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Exam e JOIN FETCH e.mediator WHERE e.startTime <= :now1 AND e.endTime >= :now2 AND e.mediator.department.id = :departmentId")
    List<Exam> findByStartTimeBeforeAndEndTimeAfterAndMediatorDepartmentId(
            @org.springframework.data.repository.query.Param("now1") LocalDateTime now1,
            @org.springframework.data.repository.query.Param("now2") LocalDateTime now2,
            @org.springframework.data.repository.query.Param("departmentId") Long departmentId);

    /** Exams that haven't ended yet (optimized). */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Exam e JOIN FETCH e.mediator WHERE e.endTime > :now")
    List<Exam> findByEndTimeAfter(@org.springframework.data.repository.query.Param("now") LocalDateTime now);

    /** Exams that haven't ended yet for a specific department (optimized). */
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Exam e JOIN FETCH e.mediator WHERE e.endTime > :now AND e.mediator.department.id = :departmentId")
    List<Exam> findByEndTimeAfterAndMediatorDepartmentId(@org.springframework.data.repository.query.Param("now") LocalDateTime now, @org.springframework.data.repository.query.Param("departmentId") Long departmentId);
}
