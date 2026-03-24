"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-75 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
      Loading editor...
    </div>
  ),
});

interface Question {
  id: number;
  examId: number;
  type: string;
  content: string;
  options: string | null;
  correctAnswer: string | null;
  testCases: string | null;
  language: string | null;
}

interface ExamInfo {
  id: number;
  title: string;
  durationMinutes: number;
  allowedLanguages: string[];
}

/** Maps display language names (from mediator config) → Monaco / judge0 identifiers */
const LANG_MAP: Record<string, string> = {
  Java: "java",
  Python: "python",
  "C++": "cpp",
  C: "c",
  JavaScript: "javascript",
  SQL: "sql",
  "Embedded C": "embedded c",
  "C#": "csharp",
  "c#": "csharp",
};

const MAX_VIOLATIONS = 3;

export default function TakeExamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violations, setViolations] = useState(0);

  // Coding question state
  const [codeLangs, setCodeLangs] = useState<Record<number, string>>({});
  const [codeValues, setCodeValues] = useState<Record<number, string>>({});
  const [runResults, setRunResults] = useState<Record<number, { 
    output?: string; 
    input?: string;
    actual?: string; 
    expected?: string; 
    error?: string; 
    running: boolean; 
    passed?: boolean;
    status?: string;
    statusDescription?: string;
  }>>({});

  // Watermark timestamp — refreshes every 30 s so screenshots are time-stamped
  const [watermarkTime, setWatermarkTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setWatermarkTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "STUDENT")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Request fullscreen on exam load
  useEffect(() => {
    if (!loadingData && !submitted && exam) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Some browsers block programmatic fullscreen without user gesture
      });
    }
  }, [loadingData, submitted, exam]);

  // Load exam + questions
  useEffect(() => {
    if (user && user.role === "STUDENT") loadData();
  }, [user]);

  async function loadData() {
    setLoadingData(true);
    try {
      const [examData, questionsData] = await Promise.all([
        apiFetch<ExamInfo>(`/student/exams/${examId}`),
        apiFetch<Question[]>(`/student/exams/${examId}/questions`),
      ]);
      setExam(examData);
      setQuestions(questionsData);
      setTimeLeft(examData.durationMinutes * 60);
      const examAllowed = examData.allowedLanguages ?? [];
      const defaults: Record<number, string> = {};
      
      questionsData.forEach((q) => {
        if (q.type === "CODING") {
          // Priority: Question-specific languages -> Exam-wide allowed languages -> Defaults
          const qAllowed = q.language ? q.language.split(",").map((s: string) => s.trim()).filter(Boolean) : examAllowed;
          
          if (qAllowed.length > 0) {
            const firstLangKey = LANG_MAP[qAllowed[0]] ?? qAllowed[0].toLowerCase();
            defaults[q.id] = firstLangKey;
          } else {
            defaults[q.id] = "java";
          }
        }
      });
      setCodeLangs(defaults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exam");
    } finally {
      setLoadingData(false);
    }
  }

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft !== null, submitted]);

  // Malpractice detection
  const reportViolation = useCallback(
    async (type: string) => {
      if (submitted || submittedRef.current) return;
      setViolations((v) => v + 1);
      try {
        const res = await apiFetch<{ totalViolations: number }>("/student/malpractice", {
          method: "POST",
          body: JSON.stringify({ examId: Number(examId), violationType: type }),
        });
        // Auto-lock: if server says violations >= threshold, force submit
        if (res.totalViolations >= MAX_VIOLATIONS && !submittedRef.current) {
          submittedRef.current = true;
          handleSubmit();
        }
      } catch {
        // silent — don't block exam UX on malpractice reporting
      }
    },
    [examId, submitted]
  );

  useEffect(() => {
    if (submitted || loadingData) return;

    const handleVisibility = () => {
      if (document.hidden) reportViolation("TAB_SWITCH");
    };
    const handleBlur = () => reportViolation("WINDOW_BLUR");
    const handleFullscreen = () => {
      if (!document.fullscreenElement && !submittedRef.current) {
        submittedRef.current = true;
        setError("Proctoring Violation: Fullscreen exit detected. Your exam has been automatically terminated.");
        handleSubmit();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);

    // Disable copy/paste/cut
    const blockClipboard = (e: Event) => e.preventDefault();
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    document.addEventListener("cut", blockClipboard);

    // Block PrintScreen — fires on keyup so the OS hasn't captured it yet in most browsers
    const blockPrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        reportViolation("SCREENSHOT_ATTEMPT");
      }
    };
    document.addEventListener("keyup", blockPrintScreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("keyup", blockPrintScreen);
    };
  }, [submitted, loadingData, reportViolation]);

  /** Returns the first allowed language key (e.g. "java") or falls back to "java". */
  function getDefaultLang(): string {
    const allowed = exam?.allowedLanguages ?? [];
    if (allowed.length > 0) return LANG_MAP[allowed[0]] ?? allowed[0].toLowerCase();
    return "java";
  }

  function setAnswer(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function setCodeLang(questionId: number, lang: string) {
    setCodeLangs((prev) => ({ ...prev, [questionId]: lang }));
    // Update the answer JSON when language changes
    const code = codeValues[questionId] || "";
    setAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify({ code, language: lang }),
    }));
  }

  function setCodeValue(questionId: number, code: string) {
    setCodeValues((prev) => ({ ...prev, [questionId]: code }));
    const lang = codeLangs[questionId] || getDefaultLang();
    setAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify({ code, language: lang }),
    }));
  }

  async function handleRunCode(questionId: number) {
    const code = codeValues[questionId] || "";
    const language = codeLangs[questionId] || getDefaultLang();
    if (!code.trim()) return;
    setRunResults((prev) => ({ ...prev, [questionId]: { running: true } }));
    try {
      const result = await apiFetch<{
        passed: boolean;
        actualOutput: string;
        expectedOutput: string;
        testInput: string;
        stderr: string;
        compileOutput: string;
        statusDescription: string;
      }>("/student/code/run", {
        method: "POST",
        body: JSON.stringify({ sourceCode: code, language, stdin: "", questionId }),
      });
      
      setRunResults((prev) => ({ 
        ...prev, 
        [questionId]: { 
          input: result.testInput,
          actual: result.actualOutput,
          expected: result.expectedOutput,
          error: result.compileOutput || result.stderr,
          status: result.statusDescription,
          statusDescription: result.statusDescription,
          passed: result.passed,
          running: false 
        } 
      }));
    } catch (err) {
      setRunResults((prev) => ({
        ...prev,
        [questionId]: {
          error: err instanceof Error ? err.message : "Run failed",
          running: false,
        },
      }));
    }
  }

  async function handleSubmit() {
    if (submitting || submitted) return;
    setError("");
    setSubmitting(true);

    // Build answers map: questionId -> answer string
    const answersMap: Record<string, string> = {};
    for (const [qId, ans] of Object.entries(answers)) {
      answersMap[qId] = ans;
    }

    try {
      const result = await apiFetch<{
        id: number;
        score: number;
        examTitle: string;
      }>("/student/submit", {
        method: "POST",
        body: JSON.stringify({
          examId: Number(examId),
          answers: answersMap,
        }),
      });
      setSubmitted(true);
      setScore(result.score);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading exam...</p>
      </div>
    );
  }

  if (!user || user.role !== "STUDENT") return null;

  // Submitted view
  if (submitted && score !== null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2">Exam Submitted!</h1>
          <p className="text-gray-400 mb-6">{exam?.title}</p>
          <p className="text-6xl font-bold mb-2">
            <span className={score >= 50 ? "text-green-400" : "text-red-400"}>
              {score}%
            </span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {violations > 0 && `${violations} violation(s) recorded`}
          </p>
          <button
            onClick={() => router.push("/student")}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white select-none" onContextMenu={(e) => e.preventDefault()}>

      {/* ── Anti-cheat watermark overlay ─────────────────────────────────────
          Diagonal repeating pattern with student identity + timestamp.
          pointer-events-none so it never blocks clicks on questions.
          z-50 keeps it above all exam content.
      ────────────────────────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
        aria-hidden="true"
      >
        {Array.from({ length: 25 }).map((_, i) => {
            const row = Math.floor(i / 5);   // 0-4  → spreads vertically
            const col = i % 5;               // 0-4  → spreads horizontally
            const topPct  = row * 22;                        // 0, 22, 44, 66, 88
            const leftPct = col * 21 + (row % 2) * 10;      // stagger odd rows by 10%
            return (
              <div
                key={i}
                className="absolute text-white/[0.12] text-xs font-semibold whitespace-nowrap"
                style={{
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  transform: "rotate(-35deg)",
                  userSelect: "none",
                  letterSpacing: "0.05em",
                }}
              >
                {user?.name} · {user?.email} · {watermarkTime.toLocaleTimeString()}
              </div>
            );
          })}
      </div>

      {/* Sticky header with timer */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-8 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold">{exam?.title}</h1>
          <p className="text-xs text-gray-400">{questions.length} questions</p>
        </div>
        <div className="flex items-center gap-4">
          {violations > 0 && (
            <span className="text-xs text-yellow-400 bg-yellow-900/40 px-2 py-1 rounded">
              {violations} violation(s)
            </span>
          )}
          <span
            className={`font-mono text-lg font-bold ${
              timeLeft !== null && timeLeft < 60
                ? "text-red-400 animate-pulse"
                : "text-green-400"
            }`}
          >
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </span>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mt-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Questions */}
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {questions.map((q, idx) => {
          const opts = q.type === "MCQ" && q.options ? JSON.parse(q.options) : null;

          return (
            <div
              key={q.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <p className="text-sm text-gray-400 mb-2">
                Question {idx + 1}{" "}
                <span className="ml-2 px-2 py-0.5 rounded bg-gray-800 text-xs">
                  {q.type}
                </span>
              </p>
              <p className="mb-4">{q.content}</p>

              {q.type === "MCQ" && opts && (
                <div className="space-y-2">
                  {Object.entries(opts as Record<string, string>).map(
                    ([key, text]) => (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          answers[q.id] === key
                            ? "border-blue-500 bg-blue-900/30"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={key}
                          checked={answers[q.id] === key}
                          onChange={() => setAnswer(q.id, key)}
                          className="accent-blue-500"
                        />
                        <span>
                          <strong className="text-gray-300">{key}.</strong>{" "}
                          {text}
                        </span>
                      </label>
                    )
                  )}
                </div>
              )}

              {q.type === "CODING" && (
                <div className="space-y-3">
                  {/* Language selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-400">Language:</label>
                    {(() => {
                      // Priority: Question-specific languages -> Exam-wide allowed languages -> Defaults
                      const examAllowed = exam?.allowedLanguages ?? [];
                      const qAllowed = q.language ? q.language.split(",").map((s: string) => s.trim()).filter(Boolean) : examAllowed;

                      const langOptions = qAllowed.length > 0
                        ? qAllowed.map((l: string) => ({ label: l, value: LANG_MAP[l] ?? l.toLowerCase() }))
                        : [
                            { label: "Java",   value: "java"   },
                            { label: "Python", value: "python" },
                            { label: "C++",    value: "cpp"    },
                          ];
                      return (
                        <select
                          value={codeLangs[q.id] || langOptions[0].value}
                          onChange={(e) => setCodeLang(q.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {langOptions.map((o: { label: string; value: string }) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => handleRunCode(q.id)}
                      disabled={runResults[q.id]?.running}
                      className="ml-auto px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {runResults[q.id]?.running ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Running...
                        </>
                      ) : (
                        "▶ Run Code"
                      )}
                    </button>
                  </div>

                  {/* Monaco Editor */}
                  <CodeEditor
                    language={codeLangs[q.id] || "java"}
                    value={codeValues[q.id] || ""}
                    onChange={(val) => setCodeValue(q.id, val)}
                  />

                  {/* Minimalist Run output */}
                  {(() => {
                    const res = runResults[q.id];
                    if (!res || res.running) return null;
                    return (
                      <div className="space-y-3">
                        {/* Only show failure alert if not passed */}
                        {!res.passed && (
                          <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3 text-red-100 font-bold mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="text-sm">Execution Failed</span>
                            </div>
                            <div className="space-y-2">
                              {/* Root Cause: Specific Error Message from Backend (Status Description) */}
                              <p className="text-sm text-red-100 bg-red-950/40 p-3 rounded-lg border border-red-500/30 font-mono">
                                <strong className="text-red-400">Error:</strong> {res.statusDescription || "Test case failed."}
                              </p>
                              
                              {/* Detailed diagnostics (Stderr/Compile Errors) only if present */}
                              {res.error && (
                                <pre className="p-2 rounded bg-red-950/20 border border-red-950/50 text-[11px] text-red-300 font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                  {res.error}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}

                        {/* If passed, just show center-aligned success */}
                        {res.passed && (
                          <div className="text-center py-2">
                            <span className="px-4 py-2 rounded-full bg-green-900/20 border border-green-500/40 text-green-400 font-bold text-sm animate-in zoom-in duration-300">
                              SUCCESS ✅
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit button */}
        <div className="flex justify-center pt-4 pb-12">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-semibold text-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
