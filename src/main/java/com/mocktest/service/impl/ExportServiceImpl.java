package com.mocktest.service.impl;

import com.mocktest.models.Exam;
import com.mocktest.models.Submission;
import com.mocktest.repositories.ExamRepository;
import com.mocktest.repositories.MalpracticeLogRepository;
import com.mocktest.repositories.SubmissionRepository;
import com.mocktest.service.ExportService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExportServiceImpl implements ExportService {

    private final SubmissionRepository submissionRepository;
    private final MalpracticeLogRepository malpracticeLogRepository;
    private final ExamRepository examRepository;

    public ExportServiceImpl(SubmissionRepository submissionRepository,
                             MalpracticeLogRepository malpracticeLogRepository,
                             ExamRepository examRepository) {
        this.submissionRepository = submissionRepository;
        this.malpracticeLogRepository = malpracticeLogRepository;
        this.examRepository = examRepository;
    }

    @Override
    public byte[] exportExamScores(Long examId) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found: " + examId));

        List<Submission> submissions = submissionRepository.findByExamId(examId);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Exam Scores");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Student Name", "Register Number", "Score (%)", "Malpractice Activity"};
            
            CellStyle headerCellStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerCellStyle.setFont(headerFont);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Fill data rows
            int rowIdx = 1;
            for (Submission submission : submissions) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(submission.getUser().getName());
                row.createCell(1).setCellValue(submission.getUser().getRegisterNumber() != null 
                        ? submission.getUser().getRegisterNumber() : "N/A");
                row.createCell(2).setCellValue(submission.getScore());
                
                long violations = malpracticeLogRepository.countByUserIdAndExamId(
                        submission.getUser().getId(), examId);
                row.createCell(3).setCellValue(violations + " violations");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(bos);
            return bos.toByteArray();
        }
    }
}
