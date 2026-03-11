package com.mocktest.service.impl;

import com.mocktest.antlr.CodeCheck;
import com.mocktest.service.CodeConstraintChecker;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.Token;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * ANTLR4-powered implementation of {@link CodeConstraintChecker}.
 *
 * The {@link CodeCheck} lexer is generated at build time from
 * {@code src/main/antlr4/com/mocktest/antlr/CodeCheck.g4}. It skips
 * string literals and comments, so every token returned represents real
 * executable code — never text inside a comment or a quoted string.
 *
 * <h3>Per-language token groups</h3>
 * The grammar assigns distinct token IDs to language-specific keywords:
 * <ul>
 *   <li><b>JAVA_*</b> — {@code JAVA_IMPLEMENTS}, {@code JAVA_EXTENDS},
 *       {@code JAVA_SUPER}, {@code JAVA_THIS}, {@code JAVA_INTERFACE}, etc.</li>
 *   <li><b>PY_*</b>   — {@code PY_DEF}, {@code PY_LAMBDA}, {@code PY_ELIF},
 *       {@code PY_YIELD}, {@code PY_ASYNC}, etc.</li>
 *   <li><b>CPP_*</b>  — {@code CPP_NAMESPACE}, {@code CPP_TEMPLATE},
 *       {@code CPP_COUT}, {@code CPP_PRINTF}, {@code CPP_STRUCT}, etc.</li>
 *   <li><b>KW_*</b>   — shared keywords ({@code KW_FOR}, {@code KW_CLASS},
 *       {@code KW_RETURN}, etc.)</li>
 * </ul>
 * Use {@link #JAVA_TOKENS}, {@link #PYTHON_TOKENS}, and {@link #CPP_TOKENS}
 * to obtain the token-ID set for a given language.
 */
@Service
public class CodeConstraintCheckerImpl implements CodeConstraintChecker {

    // ── Per-language token ID sets ────────────────────────────────────────────

    /** All token IDs relevant to Java source code. */
    public static final Set<Integer> JAVA_TOKENS = Set.of(
            CodeCheck.JAVA_IMPLEMENTS, CodeCheck.JAVA_EXTENDS, CodeCheck.JAVA_SUPER,
            CodeCheck.JAVA_THIS, CodeCheck.JAVA_INTERFACE, CodeCheck.JAVA_INSTANCEOF,
            CodeCheck.JAVA_PACKAGE, CodeCheck.JAVA_THROW, CodeCheck.JAVA_THROWS,
            CodeCheck.JAVA_FINAL, CodeCheck.JAVA_ABSTRACT, CodeCheck.JAVA_SYNCHRONIZED,
            CodeCheck.JAVA_IMPORT, CodeCheck.JAVA_ENUM,
            // shared keywords also used in Java
            CodeCheck.KW_CLASS, CodeCheck.KW_NEW, CodeCheck.KW_FOR, CodeCheck.KW_WHILE,
            CodeCheck.KW_DO, CodeCheck.KW_SWITCH, CodeCheck.KW_BREAK, CodeCheck.KW_CONTINUE,
            CodeCheck.KW_RETURN, CodeCheck.KW_VOID, CodeCheck.KW_STATIC,
            CodeCheck.KW_IF, CodeCheck.KW_ELSE, CodeCheck.KW_SORT
    );

    /** All token IDs relevant to Python source code. */
    public static final Set<Integer> PYTHON_TOKENS = Set.of(
            CodeCheck.PY_DEF, CodeCheck.PY_LAMBDA, CodeCheck.PY_ELIF,
            CodeCheck.PY_PASS, CodeCheck.PY_YIELD, CodeCheck.PY_ASYNC,
            CodeCheck.PY_AWAIT, CodeCheck.PY_NONE, CodeCheck.PY_WITH,
            CodeCheck.PY_GLOBAL,
            // shared keywords also used in Python
            CodeCheck.KW_CLASS, CodeCheck.KW_FOR, CodeCheck.KW_WHILE,
            CodeCheck.KW_BREAK, CodeCheck.KW_CONTINUE, CodeCheck.KW_RETURN,
            CodeCheck.KW_IF, CodeCheck.KW_ELSE, CodeCheck.KW_SORT
    );

    /** All token IDs relevant to C / C++ source code. */
    public static final Set<Integer> CPP_TOKENS = Set.of(
            CodeCheck.CPP_NAMESPACE, CodeCheck.CPP_TEMPLATE, CodeCheck.CPP_VIRTUAL,
            CodeCheck.CPP_TYPEDEF, CodeCheck.CPP_STRUCT, CodeCheck.CPP_UNION,
            CodeCheck.CPP_INCLUDE, CodeCheck.CPP_COUT, CodeCheck.CPP_CIN,
            CodeCheck.CPP_ENDL, CodeCheck.CPP_PRINTF, CodeCheck.CPP_SCANF,
            CodeCheck.CPP_MALLOC, CodeCheck.CPP_FREE,
            // shared keywords also used in C/C++
            CodeCheck.KW_CLASS, CodeCheck.KW_NEW, CodeCheck.KW_FOR, CodeCheck.KW_WHILE,
            CodeCheck.KW_DO, CodeCheck.KW_SWITCH, CodeCheck.KW_BREAK, CodeCheck.KW_CONTINUE,
            CodeCheck.KW_RETURN, CodeCheck.KW_VOID, CodeCheck.KW_STATIC,
            CodeCheck.KW_IF, CodeCheck.KW_ELSE, CodeCheck.KW_SORT
    );

    /**
     * Returns the token-ID set for the given language string.
     * Falls back to {@link #JAVA_TOKENS} for unrecognised languages.
     */
    public static Set<Integer> tokensForLanguage(String language) {
        if (language == null) return JAVA_TOKENS;
        return switch (language.toLowerCase()) {
            case "python", "py" -> PYTHON_TOKENS;
            case "c", "cpp", "c++", "cc" -> CPP_TOKENS;
            default -> JAVA_TOKENS;
        };
    }

    // ── public API ───────────────────────────────────────────────────────────

    @Override
    public List<String> findBannedKeywords(String code, List<String> bannedList) {
        if (code == null || code.isBlank() || bannedList == null || bannedList.isEmpty()) {
            return Collections.emptyList();
        }

        // Normalise banned list: lower-case, trimmed, distinct
        Set<String> banned = bannedList.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Set<String> found = new LinkedHashSet<>();
        for (Token token : tokenise(code)) {
            String text = token.getText().toLowerCase();
            if (banned.contains(text)) {
                found.add(text);
            }
            // Special case: C++ '#include <...>' is one token whose text starts with
            // '#include' – report it as the banned word "include" when present.
            if (token.getType() == CodeCheck.CPP_HASH_INCLUDE
                    && banned.contains("include")) {
                found.add("include");
            }
        }
        return new ArrayList<>(found);
    }

    @Override
    public boolean usesOOP(String code) {
        if (code == null || code.isBlank()) return false;

        for (Token token : tokenise(code)) {
            int type = token.getType();
            // KW_CLASS is shared; JAVA_INTERFACE for Java; CPP_STRUCT for C/C++
            if (type == CodeCheck.KW_CLASS
                    || type == CodeCheck.JAVA_INTERFACE
                    || type == CodeCheck.CPP_STRUCT
                    || type == CodeCheck.CPP_NAMESPACE) {
                return true;
            }
        }
        return false;
    }

    @Override
    public boolean usesRecursion(String code) {
        if (code == null || code.isBlank()) return false;

        // Step 1: extract all function/method names defined in this source
        Set<String> functionNames = extractFunctionNames(code);
        if (functionNames.isEmpty()) return false;

        // Step 2: collect all IDENTIFIER tokens (skipping string/comment contents
        //         via the lexer grammar)
        List<String> identifiers = tokenise(code).stream()
                .filter(t -> t.getType() == CodeCheck.IDENTIFIER)
                .map(Token::getText)
                .collect(Collectors.toList());

        // Step 3: a function is recursive if its name appears MORE than once
        //         (once for the definition, once or more for the call)
        for (String name : functionNames) {
            long count = identifiers.stream().filter(name::equals).count();
            if (count >= 2) {
                return true;
            }
        }
        return false;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /**
     * Runs the ANTLR lexer on {@code code} and returns all non-skipped tokens
     * (i.e. every token that was NOT swallowed by {@code -> skip} rules).
     *
     * Note: since every "OTHER" and every string/comment token has {@code -> skip},
     * the only tokens returned are keyword tokens and IDENTIFIER tokens.
     */
    private List<Token> tokenise(String code) {
        CodeCheck lexer = new CodeCheck(CharStreams.fromString(code));
        // Suppress the default ANTLR console error listener (noisy in tests)
        lexer.removeErrorListeners();
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        tokens.fill();

        List<Token> result = new ArrayList<>();
        for (Token t : tokens.getTokens()) {
            if (t.getType() != Token.EOF) {
                result.add(t);
            }
        }
        return result;
    }

    /**
     * Heuristic: extracts function/method names from source code using language-
     * agnostic regex patterns:
     * <ul>
     *   <li>Java / C / C++ / JS:  {@code type name(} or {@code name(}</li>
     *   <li>Python:                {@code def name(}</li>
     * </ul>
     */
    private Set<String> extractFunctionNames(String code) {
        Set<String> names = new LinkedHashSet<>();

        // Java/C++/JS: optional modifiers + return type + name + '('
        // e.g.  public int fibonacci( ... )
        //        static void solve(
        //        myFunction(
        Pattern javaStyle = Pattern.compile(
                "(?:(?:public|private|protected|static|final|synchronized|abstract|override)\\s+)*" +
                "(?:[A-Za-z_$][A-Za-z0-9_$<>\\[\\]]*\\s+)?" +
                "([A-Za-z_$][A-Za-z0-9_$]*)\\s*\\("
        );

        // Python: def name(
        Pattern pythonStyle = Pattern.compile("\\bdef\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\(");

        for (Pattern p : List.of(javaStyle, pythonStyle)) {
            Matcher m = p.matcher(code);
            while (m.find()) {
                String name = m.group(1);
                // filter out language keywords that would appear here
                if (!isKeyword(name)) {
                    names.add(name);
                }
            }
        }
        return names;
    }

    /** Reserved words that must not be treated as function names (all languages). */
    private static final Set<String> KEYWORDS = Set.of(
            // Java
            "if", "else", "for", "while", "do", "switch", "case", "return",
            "void", "int", "long", "double", "float", "boolean", "char",
            "String", "new", "class", "interface", "extends", "implements",
            "true", "false", "null", "this", "super", "static", "final",
            "try", "catch", "finally", "throw", "throws", "import", "package",
            "public", "private", "protected", "abstract", "synchronized",
            "instanceof", "enum",
            // Python
            "def", "lambda", "print", "pass", "in", "is", "not", "and", "or",
            "elif", "yield", "async", "await", "with", "global", "nonlocal", "None",
            // C / C++
            "namespace", "template", "virtual", "typedef", "struct", "union",
            "include", "cout", "cin", "endl", "printf", "scanf", "malloc", "free",
            "sizeof", "nullptr", "delete", "const", "inline", "extern"
    );

    private boolean isKeyword(String word) {
        return KEYWORDS.contains(word);
    }
}
