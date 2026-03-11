package com.mocktest.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mocktest.dto.code.CodeExecutionResult;
import com.mocktest.exception.BadRequestException;
import com.mocktest.service.CodeExecutionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
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

    private final String apiUrl;
    private final String apiKey;     // optional – for RapidAPI hosted Judge0
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient;

    /** Judge0 language IDs: https://ce.judge0.com/languages */
    private static final Map<String, Integer> LANGUAGE_MAP = Map.of(
            "java",   62,  // Java (OpenJDK 13)
            "python", 71,  // Python 3
            "cpp",    54   // C++ (GCC 9)
    );

    public Judge0CodeExecutionService(
            @Value("${app.judge0.api-url:https://judge0-ce.p.rapidapi.com}") String apiUrl,
            @Value("${app.judge0.api-key:}") String apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public CodeExecutionResult execute(String sourceCode, String language, String stdin) {
        int langId = languageId(language);

        try {
            // Build the JSON body with base64-encoded fields
            String body = mapper.writeValueAsString(Map.of(
                    "source_code", b64Encode(sourceCode),
                    "language_id", langId,
                    "stdin", b64Encode(stdin != null ? stdin : "")
            ));

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/submissions?base64_encoded=true&wait=true"))
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

            return result;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            CodeExecutionResult errorResult = new CodeExecutionResult();
            errorResult.setStatusId(-1);
            errorResult.setStatusDescription("Execution service error: " + e.getMessage());
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
