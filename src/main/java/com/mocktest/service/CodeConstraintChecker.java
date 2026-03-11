package com.mocktest.service;

import java.util.List;

/**
 * AST-based (ANTLR4 lexer) checker for coding constraints.
 *
 * All methods receive raw source code as a String; the underlying lexer
 * skips the contents of string literals and comments so that the checks
 * never produce false positives on code embedded in those constructs.
 */
public interface CodeConstraintChecker {

    /**
     * Returns the subset of {@code bannedList} that actually appears as a
     * token in {@code code} (comments and string contents excluded).
     *
     * @param code       raw student source code
     * @param bannedList keywords/identifiers the mediator has banned
     * @return possibly-empty list of matched banned terms
     */
    List<String> findBannedKeywords(String code, List<String> bannedList);

    /**
     * Returns {@code true} if {@code code} contains at least one class
     * definition keyword (class / interface), indicating OOP usage.
     *
     * @param code raw student source code
     */
    boolean usesOOP(String code);

    /**
     * Returns {@code true} if the code appears to contain a recursive call,
     * i.e. a function/method whose name reappears as a token inside the same
     * source unit.  This is a conservative heuristic.
     *
     * @param code raw student source code
     */
    boolean usesRecursion(String code);
}
