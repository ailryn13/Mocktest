// CodeCheck.g4 -- ANTLR4 Lexer Grammar for coding-constraint enforcement.
//
// Purpose: tokenise student source code (Java / Python / C / C++ / JS)
// and emit ONLY the keyword tokens we care about, while completely
// skipping string literals and comments so keywords inside them are ignored.
//
// Token ID groups:
//   JAVA_*  (IDs 1-14)  -- keywords exclusive to Java
//   PY_*    (IDs 15-24) -- keywords exclusive to Python
//   CPP_*   (IDs 25-35) -- keywords/identifiers exclusive to C/C++
//   KW_*    (IDs 36-48) -- keywords shared across multiple languages
//   IDENTIFIER          -- any remaining word token (for recursion detection)
//
// Examples that are correctly ignored:
//   "for loop string"     -- string literal, skipped
//   // while (true) here  -- line comment, skipped
//   /* for i in range */  -- block comment, skipped

lexer grammar CodeCheck;

// =========================================================================
// JAVA-specific keywords (not present in Python or plain C)
// =========================================================================
JAVA_IMPLEMENTS  : 'implements' ;
JAVA_EXTENDS     : 'extends' ;
JAVA_SUPER       : 'super' ;
JAVA_THIS        : 'this' ;
JAVA_INTERFACE   : 'interface' ;
JAVA_INSTANCEOF  : 'instanceof' ;
JAVA_PACKAGE     : 'package' ;
JAVA_THROW       : 'throw' ;
JAVA_THROWS      : 'throws' ;
JAVA_FINAL       : 'final' ;
JAVA_ABSTRACT    : 'abstract' ;
JAVA_SYNCHRONIZED : 'synchronized' ;
JAVA_IMPORT      : 'import' ;
JAVA_ENUM        : 'enum' ;

// =========================================================================
// PYTHON-specific keywords
// =========================================================================
PY_DEF           : 'def' ;
PY_LAMBDA        : 'lambda' ;
PY_ELIF          : 'elif' ;
PY_PASS          : 'pass' ;
PY_YIELD         : 'yield' ;
PY_ASYNC         : 'async' ;
PY_AWAIT         : 'await' ;
PY_NONE          : 'None' ;
PY_WITH          : 'with' ;
PY_GLOBAL        : 'global' ;

// =========================================================================
// C / C++-specific keywords and common identifiers
// =========================================================================
CPP_NAMESPACE    : 'namespace' ;
CPP_TEMPLATE     : 'template' ;
CPP_VIRTUAL      : 'virtual' ;
CPP_TYPEDEF      : 'typedef' ;
CPP_STRUCT       : 'struct' ;
CPP_UNION        : 'union' ;
CPP_INCLUDE      : 'include' ;
CPP_COUT         : 'cout' ;
CPP_CIN          : 'cin' ;
CPP_ENDL         : 'endl' ;
CPP_PRINTF       : 'printf' ;
CPP_SCANF        : 'scanf' ;
CPP_MALLOC       : 'malloc' ;
CPP_FREE         : 'free' ;

// =========================================================================
// SHARED keywords -- appear in two or more supported languages
// =========================================================================
KW_FOR           : 'for' ;
KW_WHILE         : 'while' ;
KW_DO            : 'do' ;
KW_SWITCH        : 'switch' ;
KW_BREAK         : 'break' ;
KW_CONTINUE      : 'continue' ;
KW_CLASS         : 'class' ;
KW_NEW           : 'new' ;
KW_RETURN        : 'return' ;
KW_VOID          : 'void' ;
KW_STATIC        : 'static' ;
KW_IF            : 'if' ;
KW_ELSE          : 'else' ;
KW_SORT          : 'sort' ;
KW_ARRAY_KW      : 'array' ;

// =========================================================================
// Identifiers (needed for recursion: method name re-appears in body)
// =========================================================================
IDENTIFIER    : [a-zA-Z_$] [a-zA-Z_$0-9]* ;

// =========================================================================
// String literals: skip contents so keywords inside are ignored
// =========================================================================
// Python triple-double-quoted (must come before STRING_DOUBLE)
STRING_TRIPLE_D : '"""' .*? '"""'   -> skip ;
// Python triple-single-quoted
STRING_TRIPLE_S : '\'\'\'' .*? '\'\'\'' -> skip ;
// Standard double-quoted strings
STRING_DOUBLE   : '"'  ( '\\' . | ~["\\\r\n] )* '"'  -> skip ;
// Standard single-quoted strings / chars
STRING_SINGLE   : '\'' ( '\\' . | ~['\\\r\n] )* '\'' -> skip ;
// JavaScript / TypeScript template literals
STRING_TEMPLATE : '`'  ( '\\' . | ~[`\\] )*  '`'     -> skip ;

// =========================================================================
// Comments: skip entirely
// =========================================================================
LINE_COMMENT    : '//' ~[\r\n]*                       -> skip ;
BLOCK_COMMENT   : '/*' .*? '*/'                       -> skip ;
HASH_COMMENT    : '#' ~[\r\n]*                        -> skip ;

// =========================================================================
// Everything else: skip (numbers, operators, brackets, whitespace ...)
// =========================================================================
OTHER           : .                                   -> skip ;