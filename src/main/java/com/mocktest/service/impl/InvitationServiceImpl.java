package com.mocktest.service.impl;

import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.models.InvitationToken;
import com.mocktest.models.User;
import com.mocktest.models.enums.Role;
import com.mocktest.repositories.DepartmentRepository;
import com.mocktest.repositories.InvitationTokenRepository;
import com.mocktest.repositories.UserRepository;
import com.mocktest.service.InvitationService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class InvitationServiceImpl implements InvitationService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final InvitationTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url:https://mock-test.duckdns.org}")
    private String frontendUrl;

    @Value("${spring.mail.username:ganeshkumarngk2005@gmail.com}")
    private String mailFrom;

    public InvitationServiceImpl(UserRepository userRepository,
                                 DepartmentRepository departmentRepository,
                                 InvitationTokenRepository tokenRepository,
                                 JavaMailSender mailSender,
                                 PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public Map<String, Object> bulkInviteStudents(MultipartFile file, Principal principal) {
        User mediator = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Mediator not found"));

        if (mediator.getDepartment() == null || mediator.getDepartment().getParent() == null) {
            // Mediator should be under a college
            // Let's assume mediator's college is mediator.getDepartment() or its parent
            // Project logic (DepartmentServiceImpl:74): collegeId = (myDept.getParent() != null) ? myDept.getParent().getId() : myDept.getId();
        }
        
        Department myDept = mediator.getDepartment();
        Department college = (myDept.getParent() != null) ? myDept.getParent() : myDept;

        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header row
            if (rows.hasNext()) rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                try {
                    String name = getCellValue(row, 0); // Name
                    String deptName = getCellValue(row, 1); // Dept
                    String rollNum = getCellValue(row, 2); // Roll Number
                    String email = getCellValue(row, 3); // Email

                    if (email.isEmpty()) continue;

                    if (userRepository.existsByEmail(email)) {
                        errors.add("Email " + email + " already registered.");
                        failureCount++;
                        continue;
                    }

                    // Handle Department lookup/creation under the SAME college
                    Department studentDept = departmentRepository.findByName(deptName)
                            .filter(d -> d.getParent() != null && d.getParent().getId().equals(college.getId()))
                            .orElseGet(() -> {
                                Department newDept = new Department(deptName);
                                newDept.setParent(college);
                                return departmentRepository.save(newDept);
                            });

                    // Create student with a random UUID password (temporary)
                    User student = new User(name, email, passwordEncoder.encode(UUID.randomUUID().toString()), Role.STUDENT, studentDept);
                    student.setRegisterNumber(rollNum);
                    userRepository.save(student);

                    // Generate Token and Send Email
                    sendInvitationEmail(student);

                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Error processing row " + (row.getRowNum() + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to process Excel file: " + e.getMessage());
        }

        return Map.of(
                "successCount", successCount,
                "failureCount", failureCount,
                "errors", errors
        );
    }

    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: 
                if (DateUtil.isCellDateFormatted(cell)) return cell.getDateCellValue().toString();
                return String.valueOf((long)cell.getNumericCellValue());
            default: return "";
        }
    }

    private void sendInvitationEmail(User student) {
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);
        tokenRepository.save(new InvitationToken(rawToken, student, expiry));

        String inviteLink = frontendUrl + "/accept-invite?token=" + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("MockTest Platform <" + mailFrom + ">");
        message.setTo(student.getEmail());
        message.setSubject("Invitation to join MockTest Platform");
        message.setText(
                "Hi " + student.getName() + ",\n\n" +
                "You have been invited to join the MockTest Platform as a student in the " + 
                student.getDepartment().getName() + " department.\n\n" +
                "Click the link below to set your password and complete your registration:\n" +
                inviteLink + "\n\n" +
                "This link is valid for 24 hours.\n\n" +
                "Best Regards,\n" +
                "The MockTest Team"
        );
        mailSender.send(message);
    }

    @Override
    @Transactional
    public void acceptInvitation(String token, String password) {
        InvitationToken invToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired invitation token"));

        if (!invToken.isValid()) {
            throw new BadRequestException("Invitation token has expired or already been used");
        }

        User student = invToken.getStudent();
        student.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(student);

        invToken.setUsed(true);
        tokenRepository.save(invToken);
    }

    @Override
    public String validateToken(String token) {
        InvitationToken invToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid invitation token"));
        
        if (!invToken.isValid()) {
            throw new BadRequestException("Invitation token has expired or already been used");
        }
        
        return invToken.getStudent().getEmail();
    }
}
