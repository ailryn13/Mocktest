"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Question {
  id: number;
  examId: number;
  type: string;
  content: string;
  options: string | null;
  correctAnswer: string | null;
  testCases: string | null;
}

interface Submission {
  id: number;
  userId: number;
  userName: string;
  examId: number;
  examTitle: string;
  score: number;
  submittedAt: string;
}

interface MalpracticeLog {
  id: number;
  userId: number;
  userName: string;
  examId: number;
  violationType: string;
  timestamp: string;
  totalViolations: number;
}

type Tab = "questions" | "submissions" | "malpractice";

export default function ExamDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [error, setError] = useState("");

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [showQForm, setShowQForm] = useState(false);
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [qType, setQType] = useState<"MCQ" | "CODING">("MCQ");
  const [qContent, setQContent] = useState("");
  const [qOptions, setQOptions] = useState('{"A":"","B":"","C":"","D":""}');
  const [qCorrectAnswer, setQCorrectAnswer] = useState("");
  const [qTestCases, setQTestCases] = useState('[{"input":"","expectedOutput":""}]');
  const [savingQ, setSavingQ] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);

  // Malpractice state
  const [malpractice, setMalpractice] = useState<MalpracticeLog[]>([]);
  const [loadingMal, setLoadingMal] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "MEDIATOR")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load questions on mount
  useEffect(() => {
    if (user && user.role === "MEDIATOR") loadQuestions();
  }, [user]);

  async function loadQuestions() {
    setLoadingQ(true);
    try {
      const data = await apiFetch<Question[]>(`/mediator/questions/exam/${examId}`);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoadingQ(false);
    }
  }

  async function loadSubmissions() {
    setLoadingSub(true);
    try {
      const data = await apiFetch<Submission[]>(`/mediator/reports/submissions/exam/${examId}`);
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoadingSub(false);
    }
  }

  async function loadMalpractice() {
    setLoadingMal(true);
    try {
      const data = await apiFetch<MalpracticeLog[]>(`/mediator/reports/malpractice/exam/${examId}`);
      setMalpractice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load malpractice logs");
    } finally {
      setLoadingMal(false);
    }
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    if (tab === "submissions" && submissions.length === 0) loadSubmissions();
    if (tab === "malpractice" && malpractice.length === 0) loadMalpractice();
  }

  // Question form helpers
  function resetQForm() {
    setQType("MCQ");
    setQContent("");
    setQOptions('{"A":"","B":"","C":"","D":""}');
    setQCorrectAnswer("");
    setQTestCases('[{"input":"","expectedOutput":""}]');
    setEditingQId(null);
    setShowQForm(false);
  }

  function startEditQ(q: Question) {
    setEditingQId(q.id);
    setQType(q.type as "MCQ" | "CODING");
    setQContent(q.content);
    setQOptions(q.options || '{"A":"","B":"","C":"","D":""}');
    setQCorrectAnswer(q.correctAnswer || "");
    setQTestCases(q.testCases || '[{"input":"","expectedOutput":""}]');
    setShowQForm(true);
  }

  async function handleQSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSavingQ(true);

    const body = JSON.stringify({
      examId: Number(examId),
      type: qType,
      content: qContent,
      options: qType === "MCQ" ? qOptions : null,
      correctAnswer: qType === "MCQ" ? qCorrectAnswer : null,
      testCases: qType === "CODING" ? qTestCases : null,
    });

    try {
      if (editingQId !== null) {
        const updated = await apiFetch<Question>(`/mediator/questions/${editingQId}`, {
          method: "PUT",
          body,
        });
        setQuestions((prev) => prev.map((q) => (q.id === editingQId ? updated : q)));
      } else {
        const created = await apiFetch<Question>("/mediator/questions", {
          method: "POST",
          body,
        });
        setQuestions((prev) => [...prev, created]);
      }
      resetQForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingQ(false);
    }
  }

  async function handleDeleteQ(id: number) {
    if (!confirm("Delete this question?")) return;
    setError("");
    try {
      await apiFetch(`/mediator/questions/${id}`, { method: "DELETE" });
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return null;
  if (!user || user.role !== "MEDIATOR") return null;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${
      activeTab === t
        ? "bg-gray-800 text-white"
        : "text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back + header */}
        <button
          onClick={() => router.push("/mediator")}
          className="text-sm text-gray-400 hover:text-white mb-4 cursor-pointer"
        >
          ← Back to Exams
        </button>
        <h1 className="text-2xl font-bold mb-6">Exam #{examId} — Details</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-0">
          <button onClick={() => switchTab("questions")} className={tabClass("questions")}>
            Questions ({questions.length})
          </button>
          <button onClick={() => switchTab("submissions")} className={tabClass("submissions")}>
            Submissions
          </button>
          <button onClick={() => switchTab("malpractice")} className={tabClass("malpractice")}>
            Malpractice
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-b-xl rounded-tr-xl p-6">
          {/* ====== QUESTIONS TAB ====== */}
          {activeTab === "questions" && (
            <div>
              {!showQForm && (
                <button
                  onClick={() => { resetQForm(); setShowQForm(true); }}
                  className="mb-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  + Add Question
                </button>
              )}

              {showQForm && (
                <form onSubmit={handleQSubmit} className="mb-6 p-4 bg-gray-800 rounded-lg space-y-4">
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Type</label>
                      <select
                        value={qType}
                        onChange={(e) => setQType(e.target.value as "MCQ" | "CODING")}
                        className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="CODING">CODING</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Question Content</label>
                    <textarea
                      required
                      rows={3}
                      value={qContent}
                      onChange={(e) => setQContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the question text..."
                    />
                  </div>

                  {qType === "MCQ" && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Options (JSON)
                        </label>
                        <textarea
                          rows={2}
                          value={qOptions}
                          onChange={(e) => setQOptions(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Correct Answer (e.g. A)
                        </label>
                        <input
                          type="text"
                          value={qCorrectAnswer}
                          onChange={(e) => setQCorrectAnswer(e.target.value)}
                          className="w-48 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {qType === "CODING" && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Test Cases (JSON array)
                      </label>
                      <textarea
                        rows={4}
                        value={qTestCases}
                        onChange={(e) => setQTestCases(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingQ}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {savingQ ? "Saving..." : editingQId ? "Update" : "Add Question"}
                    </button>
                    <button
                      type="button"
                      onClick={resetQForm}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {loadingQ ? (
                <p className="text-gray-500 text-sm">Loading questions...</p>
              ) : questions.length === 0 ? (
                <p className="text-gray-500 text-sm">No questions yet.</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-gray-800/60 border border-gray-700/50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                          #{idx + 1} &middot; {q.type}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditQ(q)}
                            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQ(q.id)}
                            className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm mb-1">{q.content}</p>
                      {q.type === "MCQ" && q.options && (
                        <p className="text-xs text-gray-400">
                          Options: {q.options} &middot; Answer: <span className="text-green-400">{q.correctAnswer}</span>
                        </p>
                      )}
                      {q.type === "CODING" && q.testCases && (
                        <p className="text-xs text-gray-400">Test cases: {q.testCases}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== SUBMISSIONS TAB ====== */}
          {activeTab === "submissions" && (
            <div>
              {loadingSub ? (
                <p className="text-gray-500 text-sm">Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <p className="text-gray-500 text-sm">No submissions yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-gray-400 text-sm font-medium">Student</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Score</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50">
                        <td className="py-3">{s.userName}</td>
                        <td className="py-3">
                          <span className={s.score >= 50 ? "text-green-400" : "text-red-400"}>
                            {s.score}%
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 text-sm">
                          {new Date(s.submittedAt).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ====== MALPRACTICE TAB ====== */}
          {activeTab === "malpractice" && (
            <div>
              {loadingMal ? (
                <p className="text-gray-500 text-sm">Loading malpractice logs...</p>
              ) : malpractice.length === 0 ? (
                <p className="text-gray-500 text-sm">No violations recorded.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-gray-400 text-sm font-medium">Student</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Violation</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Total</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {malpractice.map((m) => (
                      <tr key={m.id} className="border-b border-gray-800/50">
                        <td className="py-3">{m.userName}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-300 text-xs font-medium">
                            {m.violationType}
                          </span>
                        </td>
                        <td className="py-3 text-red-400 font-medium">{m.totalViolations}</td>
                        <td className="py-3 text-gray-400 text-sm">
                          {new Date(m.timestamp).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
