package com.mocktest.service;

import java.io.IOException;

public interface ExportService {
    /**
     * Generates an Excel report for all student submissions in a given exam.
     * @param examId the ID of the exam
     * @return the byte array representing the Excel file content
     * @throws IOException if an error occurs during file generation
     */
    byte[] exportExamScores(Long examId) throws IOException;
}
