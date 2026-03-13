package com.mocktest.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mocktest.dto.code.CodeExecutionResult;
import com.mocktest.exception.BadRequestException;
import com.mocktest.service.CodeExecutionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.mocktest.repositories.QuestionRepository;
import com.mocktest.models.Question;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Judge0 CE (Community Edition) integration.
 * <p>
 * Uses the synchronous submission endpoint:
 * {@code POST /submissions?base64_encoded=true&wait=true}
 * <p>
 * Configure via {@code app.judge0.*} properties.
 */
@Service
public class Judge0CodeExecutionService implements CodeExecutionService {

    private static final Logger log = LoggerFactory.getLogger(Judge0CodeExecutionService.class);

    private final String apiUrl;
    private final String apiKey;     // optional – for RapidAPI hosted Judge0
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient;
    private final QuestionRepository questionRepository;

    /** Judge0 language IDs: https://ce.judge0.com/languages */
    private static final Map<String, Integer> LANGUAGE_MAP = Map.of(
            "java",   62,  // Java (OpenJDK 13)
            "python", 71,  // Python 3
            "cpp",    54,  // C++ (GCC 9)
            "c",      50   // C (GCC 9)
    );

    public Judge0CodeExecutionService(
            @Value("${app.judge0.api-url:https://judge0-ce.p.rapidapi.com}") String apiUrl,
            @Value("${app.judge0.api-key:}") String apiKey,
            QuestionRepository questionRepository) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.questionRepository = questionRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public CodeExecutionResult execute(String sourceCode, String language, String stdin, Long questionId) {
        int langId = languageId(language);
        String finalStdin = stdin;
        String expectedOutput = null;

        // If questionId is provided, pull the first hidden test case for validation
        if (questionId != null) {
            Question q = questionRepository.findById(questionId).orElse(null);
            if (q != null && q.getTestCases() != null) {
                try {
                    List<Map<String, String>> testCases = mapper.readValue(
                            q.getTestCases(), new com.fasterxml.jackson.core.type.TypeReference<>() {});
                    if (!testCases.isEmpty()) {
                        Map<String, String> first = testCases.get(0);
                        if (finalStdin == null || finalStdin.isBlank()) {
                            finalStdin = first.getOrDefault("input", "");
                        }
                        expectedOutput = first.containsKey("expectedOutput") 
                            ? first.get("expectedOutput") 
                            : first.getOrDefault("expected", "");
                        if (expectedOutput != null) expectedOutput = expectedOutput.trim();
                    }
                } catch (Exception e) {
                    log.warn("[DEBUG] Failed to parse test cases for question {}: {}", questionId, e.getMessage());
                }
            }
        }

        try {
            // Build the JSON body with base64-encoded fields
            String body = mapper.writeValueAsString(Map.of(
                    "source_code", b64Encode(sourceCode),
                    "language_id", langId,
                    "stdin", b64Encode(finalStdin != null ? finalStdin : "")
            ));

            // Increase wait timeout for Java compilation
            String judgeUrl = apiUrl + "/submissions?base64_encoded=true&wait=true&fields=*";
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(judgeUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body));

            // If using RapidAPI hosted Judge0, attach the API key headers
            if (apiKey != null && !apiKey.isBlank()) {
                reqBuilder.header("X-RapidAPI-Key", apiKey);
                reqBuilder.header("X-RapidAPI-Host", URI.create(apiUrl).getHost());
            }

            HttpResponse<String> response = httpClient.send(
                    reqBuilder.build(),
                    HttpResponse.BodyHandlers.ofString());
            
            log.info("[DEBUG] Judge0 HTTP {}: {}", response.statusCode(), response.body());

            JsonNode json = mapper.readTree(response.body());

            CodeExecutionResult result = new CodeExecutionResult();

            // Status
            JsonNode status = json.get("status");
            if (status != null) {
                result.setStatusId(status.get("id").asInt());
                result.setStatusDescription(status.get("description").asText());
            }

            // Stdout
            result.setActualOutput(b64Decode(json, "stdout"));

            // Stderr
            result.setStderr(b64Decode(json, "stderr"));

            // Compile output (for compile errors)
            result.setCompileOutput(b64Decode(json, "compile_output"));

            // Execution time
            JsonNode timeNode = json.get("time");
            if (timeNode != null && !timeNode.isNull()) {
                result.setExecutionTimeMs(timeNode.asDouble() * 1000); // seconds -> ms
            }

            // Normalize actual output
            String actual = result.getActualOutput() != null ? result.getActualOutput().replace("\r\n", "\n").trim() : "";
            result.setActualOutput(actual);

            // Comparison logic
            if (expectedOutput != null) {
                boolean isAccepted = result.getStatusId() == 3;
                
                // Normalize newlines and trim for robust comparison
                String normalizedExpected = expectedOutput.replace("\r\n", "\n").trim();
                
                // Strict comparison (case-sensitive) as requested
                boolean matches = normalizedExpected.isEmpty() || actual.equals(normalizedExpected);
                result.setPassed(isAccepted && matches);

                // Provide clear mismatch reason only if we had an expectation
                if (isAccepted && !matches && !normalizedExpected.isEmpty()) {
                    result.setStatusDescription("Wrong Answer: Expected '" + normalizedExpected + "' but got '" + actual + "'");
                }
                
                // Ensure DTO has clean values for the frontend
                result.setExpectedOutput(normalizedExpected);
                result.setTestInput(finalStdin);
                
                log.info("[DEBUG] Comparison - Passed: {}, Accepted: {}, Matches: {}", result.isPassed(), isAccepted, matches);
            } else {
                // If no test cases defined, just check if the code ran successfully (Accepted = 3)
                boolean isAccepted = result.getStatusId() == 3;
                result.setPassed(isAccepted);
                result.setActualOutput(actual);
                result.setTestInput(finalStdin != null ? finalStdin : "");
                log.info("[DEBUG] No test cases. Passed: {} (Accepted: {})", result.isPassed(), isAccepted);
            }

            return result;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("[DEBUG] Judge0 execution failed. Source: {}, Lang: {}, API: {}", sourceCode, language, apiUrl, e);
            CodeExecutionResult errorResult = new CodeExecutionResult();
            errorResult.setStatusId(-1);
            
            // Build a better error message avoiding "null"
            String errMsg = e.getMessage();
            if (errMsg == null) {
                errMsg = e.getClass().getSimpleName() + " (NullPointerException)";
            }
            errorResult.setStatusDescription("Execution service error: " + errMsg);
            errorResult.setPassed(false);
            return errorResult;
        }
    }

    @Override
    public int languageId(String language) {
        String lang = language.toLowerCase().trim();
        Integer id = LANGUAGE_MAP.get(lang);
        if (id == null) {
            throw new BadRequestException(
                    "Unsupported language: " + language + ". Supported: java, python, cpp");
        }
        return id;
    }

    /* ---- helpers ---- */

    private String b64Encode(String text) {
        return Base64.getEncoder().encodeToString(text.getBytes());
    }

    private String b64Decode(JsonNode root, String field) {
        JsonNode node = root.get(field);
        if (node == null || node.isNull()) return null;
        String val = node.asText().trim(); // Judge0 appends \n to base64 – trim first
        try {
            return new String(Base64.getMimeDecoder().decode(val));
        } catch (IllegalArgumentException e) {
            return val; // not base64, return as-is
        }
    }
}
