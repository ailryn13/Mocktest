package com.mocktest.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invitation_tokens")
public class InvitationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private boolean used = false;

    public InvitationToken() {}

    public InvitationToken(String token, User student, LocalDateTime expiryDate) {
        this.token = token;
        this.student = student;
        this.expiryDate = expiryDate;
    }

    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiryDate);
    }

    /* Getters & Setters */
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}
