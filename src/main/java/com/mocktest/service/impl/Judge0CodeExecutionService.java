package com.mocktest.service.impl;

import com.fasterxml.jackson.databind.*;
import com.mocktest.dto.code.CodeExecutionResult;
import com.mocktest.service.CodeExecutionService;
import com.mocktest.repositories.QuestionRepository;
import com.mocktest.models.Question;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;

@Service
public class Judge0CodeExecutionService implements CodeExecutionService {
    private static final Logger log = LoggerFactory.getLogger(Judge0CodeExecutionService.class);
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(60)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final QuestionRepository qRepo;

    @Value("${app.judge0.api-url:http://judge0-server:2358}") private String apiUrl;

    public Judge0CodeExecutionService(QuestionRepository q) { this.qRepo = q; }

    public CodeExecutionResult execute(String source, String lang, String stdin, Long qid) {
        try {
            String expected = "";
            String finalInput = (stdin != null && !stdin.trim().isEmpty()) ? stdin : "";

            // 1. Fetch Question context for input/expected output if not provided
            if (qid != null) {
                Question q = qRepo.findById(qid).orElse(null);
                if (q != null && q.getTestCases() != null) {
                    JsonNode node = mapper.readTree(q.getTestCases());
                    if (node.isArray() && node.size() > 0) {
                        JsonNode firstCase = node.get(0);
                        // Try both common property names for expected output
                        expected = firstCase.path("expected").asText("");
                        if (expected.isEmpty()) expected = firstCase.path("expectedOutput").asText("");
                        
                        // If student provided NO custom input, use the sample input/stdin from the question
                        if (finalInput.isEmpty()) {
                            finalInput = firstCase.path("input").asText("");
                            if (finalInput.isEmpty()) finalInput = firstCase.path("stdin").asText("");
                        }
                    }
                }
            }

            // 2. Prepare Request body for Judge0
            Map<String, Object> body = new HashMap<>();
            body.put("source_code", Base64.getEncoder().encodeToString(source.getBytes()));
            body.put("language_id", languageId(lang));
            body.put("stdin", Base64.getEncoder().encodeToString(finalInput.getBytes()));
            // Java 21+ on Judge0 needs Serial GC to run reliably in low-memory environments.
            // We use -J to pass options to the compiler process (javac).
            // Default MAX_MEMORY_LIMIT on most Judge0 instances is 512000 (500MB).
            int requestedMemoryLimit = "java".equalsIgnoreCase(lang) ? 512000 : 256000; 
            body.put("memory_limit", requestedMemoryLimit);
            if ("java".equalsIgnoreCase(lang)) {
                // Keep JVM heap at 384MB to allow some overhead within the 500MB (512000KB) limit.
                body.put("compiler_options", "-J-Xmx384m -J-Xms128m -J-XX:+UseSerialGC");
            }
            body.put("stack_limit", 64000);
            body.put("cpu_time_limit", 15.0);
            body.put("wall_time_limit", 20.0); 


            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/submissions?base64_encoded=true&wait=true"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

            // 3. Process Result
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("[DEBUG] Judge0 HTTP {}: {}", response.statusCode(), response.body());
            JsonNode resultNode = mapper.readTree(response.body());
            
            CodeExecutionResult res = new CodeExecutionResult();

            if (response.statusCode() >= 400) {
                res.setStatusId(response.statusCode());
                String apiError = resultNode.path("message").asText("");
                if (apiError.isEmpty()) apiError = resultNode.toString();
                res.setStatusDescription("Judge0 API Error: " + apiError);
                res.setActualOutput("");
                res.setStderr(apiError);
                res.setCompileOutput("");
                res.setExecutionTimeMs(0);
                res.setTestInput(finalInput);
                res.setExpectedOutput(expected.trim());
                res.setPassed(false);
                return res;
            }
            
            if (resultNode.has("status")) {
                res.setStatusId(resultNode.get("status").get("id").asInt());
                res.setStatusDescription(resultNode.get("status").get("description").asText());
            }

            // Decode outputs (Stdout, Stderr, etc.)
            res.setActualOutput(decode(resultNode.path("stdout").asText()));
            res.setStderr(decode(resultNode.path("stderr").asText()));
            res.setCompileOutput(decode(resultNode.path("compile_output").asText()));
            res.setExecutionTimeMs(resultNode.path("time").asDouble() * 1000);
            res.setTestInput(finalInput);
            res.setExpectedOutput(expected.trim());

            String judgeMessage = resultNode.path("message").asText("").trim();
            if (!judgeMessage.isEmpty() && (res.getStderr() == null || res.getStderr().isEmpty())) {
                res.setStderr(judgeMessage);
            }

            // 4. Grading Logic (Status 3 = Accepted by Judge0, meaning it ran without crashing)
            String actual = res.getActualOutput() != null ? res.getActualOutput().trim() : "";
            String expectedTrimmed = expected.trim();
            
            // Strictly compare trimmed outputs
            boolean ok = res.getStatusId() == 3 && actual.equalsIgnoreCase(expectedTrimmed);
            res.setPassed(ok);

            if (res.getStatusId() == 3) {
                if (ok) {
                    res.setStatusDescription("Accepted");
                } else {
                    res.setStatusDescription("Wrong Answer: Your output did not match the expected output.");
                    // Log the mismatch for the server logs
                    log.info("[DEBUG] Mismatch! Expected: [{}], Got: [{}]", expectedTrimmed, actual);
                }
            }


            return res;
        } catch (Exception e) { 
            log.error("[DEBUG] Judge0 execution failed. Source: {}, Lang: {}, API: {}", source, lang, apiUrl, e);
            CodeExecutionResult res = new CodeExecutionResult();
            res.setStatusId(13);
            res.setStatusDescription("Execution Error");
            res.setActualOutput("");
            res.setStderr(e.getMessage() == null ? "Unknown execution error" : e.getMessage());
            res.setCompileOutput("");
            res.setExecutionTimeMs(0);
            res.setTestInput(stdin == null ? "" : stdin);
            res.setExpectedOutput("");
            res.setPassed(false);
            return res;
        }
    }

    public int languageId(String l) {
        if (l == null) return 71; // Default to Python if null
        return switch (l.toLowerCase()) {
            case "java" -> 62;
            case "python" -> 71;
            case "cpp", "c++" -> 54;
            case "c" -> 50;
            case "csharp", "c#" -> 51;
            case "javascript" -> 63;
            default -> 71;
        };
    }

    private String decode(String base64) {
        if (base64 == null || base64.isEmpty() || "null".equals(base64)) return "";
        try {
            return new String(Base64.getMimeDecoder().decode(base64.trim()))
                .replace("\r\n", "\n").trim();
        } catch (Exception e) {
            return "";
        }
    }
}
