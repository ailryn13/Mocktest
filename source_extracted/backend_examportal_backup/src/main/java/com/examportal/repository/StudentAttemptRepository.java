package com.examportal.repository;

import com.examportal.entity.AttemptStatus;
import com.examportal.entity.StudentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAttemptRepository extends JpaRepository<StudentAttempt, Long> {
    
    Optional<StudentAttempt> findByTestIdAndStudentId(Long testId, Long studentId);
    
    List<StudentAttempt> findByTestId(Long testId);
    
    List<StudentAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);
    
    List<StudentAttempt> findByTestIdAndStatus(Long testId, AttemptStatus status);
    
    boolean existsByTestIdAndStudentId(Long testId, Long studentId);
    
    // College-based queries
    List<StudentAttempt> findByCollegeId(Long collegeId);
    
    List<StudentAttempt> findByCollegeIdAndStudentId(Long collegeId, Long studentId);
    
    List<StudentAttempt> findByCollegeIdAndTestId(Long collegeId, Long testId);
    
    @Query("SELECT COUNT(sa) FROM StudentAttempt sa WHERE sa.college.id = :collegeId")
    long countByCollegeId(@Param("collegeId") Long collegeId);
    
    @Query("SELECT COUNT(sa) FROM StudentAttempt sa WHERE sa.college.id = :collegeId AND sa.status = :status")
    long countByCollegeIdAndStatus(@Param("collegeId") Long collegeId, @Param("status") AttemptStatus status);
}
