package com.mocktest.service;

import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.Map;

public interface InvitationService {
    Map<String, Object> bulkInviteStudents(MultipartFile file, Principal principal);
    void acceptInvitation(String token, String password);
    String validateToken(String token);
}
