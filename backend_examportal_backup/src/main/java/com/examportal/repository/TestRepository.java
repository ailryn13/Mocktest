package com.examportal.repository;

import com.examportal.entity.Test;
import com.examportal.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long>, JpaSpecificationExecutor<Test> {

        // College-based queries (primary isolation)
        List<Test> findByCollege(College college);
        
        List<Test> findByCollegeId(Long collegeId);
        
        List<Test> findByCollegeIdAndDepartment(Long collegeId, String department);
        
        List<Test> findByCollegeIdAndDepartmentIn(Long collegeId, List<String> departments);
        
        List<Test> findByCollegeIdAndStartDateTimeBeforeOrderByStartDateTimeDesc(
                        Long collegeId,
                        LocalDateTime dateTime);
        
        List<Test> findByCollegeIdAndEndDateTimeAfterOrderByStartDateTimeAsc(
                        Long collegeId,
                        LocalDateTime dateTime);
        
        List<Test> findByCollegeIdAndDepartmentInAndEndDateTimeAfterOrderByStartDateTimeAsc(
                        Long collegeId,
                        List<String> departments,
                        LocalDateTime dateTime);
        
        @Query("SELECT COUNT(t) FROM Test t WHERE t.college.id = :collegeId")
        long countByCollegeId(@Param("collegeId") Long collegeId);
        
        @Query("SELECT COUNT(t) FROM Test t WHERE t.college.id = :collegeId AND t.department = :department")
        long countByCollegeIdAndDepartment(@Param("collegeId") Long collegeId, @Param("department") String department);
        
        // Legacy department-only queries (deprecated - for backward compatibility)
        @Deprecated
        List<Test> findByDepartment(String department);

        @Deprecated
        List<Test> findByDepartmentIn(List<String> departments);
}
