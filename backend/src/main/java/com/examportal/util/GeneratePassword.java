package com.examportal.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility to generate BCrypt password hashes
 * 
 * Usage:
 * java -cp . com.examportal.util.GeneratePassword SuperAdmin@123456
 * 
 * Or run via Maven:
 * mvn exec:java -Dexec.mainClass="com.examportal.util.GeneratePassword"
 */
public class GeneratePassword {

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Usage: java GeneratePassword <password>");
            System.out.println("Example: java GeneratePassword SuperAdmin@123456");
            return;
        }

        String password = args[0];
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashedPassword = encoder.encode(password);

        System.out.println("========================================");
        System.out.println("Password Encryption Tool");
        System.out.println("========================================");
        System.out.println("Original Password: " + password);
        System.out.println();
        System.out.println("Hashed Password (BCrypt):");
        System.out.println(hashedPassword);
        System.out.println();
        System.out.println("========================================");
        System.out.println("Copy the hashed password above and use it");
        System.out.println("in your SQL INSERT statement.");
        System.out.println("========================================");
    }
}
