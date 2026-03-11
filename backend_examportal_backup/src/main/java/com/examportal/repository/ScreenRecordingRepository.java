package com.examportal.repository;

import com.examportal.entity.ScreenRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScreenRecordingRepository extends JpaRepository<ScreenRecording, Long> {
    
    List<ScreenRecording> findByAttemptIdOrderByChunkNumberAsc(Long attemptId);
    
    void deleteByAttemptId(Long attemptId);
    
    // College-based queries
    List<ScreenRecording> findByCollegeId(Long collegeId);
    
    @Query("SELECT COUNT(sr) FROM ScreenRecording sr WHERE sr.college.id = :collegeId")
    long countByCollegeId(@Param("collegeId") Long collegeId);
    
    @Query("SELECT COALESCE(SUM(sr.fileSize), 0) FROM ScreenRecording sr WHERE sr.college.id = :collegeId")
    long sumFileSizeByCollegeId(@Param("collegeId") Long collegeId);
}
