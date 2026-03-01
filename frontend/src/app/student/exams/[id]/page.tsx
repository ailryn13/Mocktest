"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
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
}

interface ExamInfo {
  id: number;
  title: string;
  durationMinutes: number;
}

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
  const [runResults, setRunResults] = useState<Record<number, { output?: string; error?: string; running: boolean }>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_VIOLATIONS = 3;
  const submittedRef = useRef(false);

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
      if (!document.fullscreenElement) reportViolation("FULLSCREEN_EXIT");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);

    // Disable copy/paste/cut
    const blockClipboard = (e: Event) => e.preventDefault();
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    document.addEventListener("cut", blockClipboard);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
    };
  }, [submitted, loadingData, reportViolation]);

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
    const lang = codeLangs[questionId] || "java";
    setAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify({ code, language: lang }),
    }));
  }

  async function handleRunCode(questionId: number) {
    const code = codeValues[questionId] || "";
    const language = codeLangs[questionId] || "java";
    if (!code.trim()) return;
    setRunResults((prev) => ({ ...prev, [questionId]: { running: true } }));
    try {
      const result = await apiFetch<{
        passed: boolean;
        actualOutput: string;
        stderr: string;
        compileOutput: string;
        statusDescription: string;
      }>("/student/code/run", {
        method: "POST",
        body: JSON.stringify({ sourceCode: code, language, stdin: "", questionId }),
      });
      const output = result.actualOutput || result.compileOutput || result.stderr || result.statusDescription || "No output";
      setRunResults((prev) => ({ ...prev, [questionId]: { output, running: false } }));
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
                    <select
                      value={codeLangs[q.id] || "java"}
                      onChange={(e) => setCodeLang(q.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                    </select>
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

                  {/* Run output */}
                  {runResults[q.id] && !runResults[q.id].running && (
                    <div className="rounded-lg bg-gray-800 border border-gray-700 p-3">
                      <p className="text-xs text-gray-400 mb-1">Output:</p>
                      <pre className="text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {runResults[q.id].error ? (
                          <span className="text-red-400">{runResults[q.id].error}</span>
                        ) : (
                          <span className="text-green-300">{runResults[q.id].output}</span>
                        )}
                      </pre>
                    </div>
                  )}
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
