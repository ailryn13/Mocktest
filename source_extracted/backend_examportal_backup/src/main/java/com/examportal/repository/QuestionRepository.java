package com.examportal.repository;

import com.examportal.entity.Question;
import com.examportal.entity.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // College-based queries (primary isolation)
    List<Question> findByCollegeId(Long collegeId);
    
    List<Question> findByCollegeIdAndDepartment(Long collegeId, String department);
    
    List<Question> findByCollegeIdAndType(Long collegeId, QuestionType type);
    
    List<Question> findByCollegeIdAndDepartmentAndType(Long collegeId, String department, QuestionType type);
    
    // Global questions (college_id = NULL) or college-specific
    @Query("SELECT q FROM Question q WHERE (q.college.id = :collegeId OR q.college IS NULL)")
    List<Question> findByCollegeIdOrGlobal(@Param("collegeId") Long collegeId);
    
    @Query("SELECT q FROM Question q WHERE (q.college.id = :collegeId OR q.college IS NULL) AND q.type = :type")
    List<Question> findByCollegeIdOrGlobalAndType(@Param("collegeId") Long collegeId, @Param("type") QuestionType type);
    
    boolean existsByQuestionTextAndCollegeId(String questionText, Long collegeId);
    
    Question findByQuestionTextAndCollegeId(String questionText, Long collegeId);
    
    List<Question> findByIdIn(List<Long> ids);
    
    // Legacy department-only queries (deprecated)
    @Deprecated
    List<Question> findByDepartment(String department);

    @Deprecated
    List<Question> findByDepartmentIn(List<String> departments);
}
