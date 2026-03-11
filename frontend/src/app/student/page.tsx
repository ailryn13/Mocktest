"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Exam {
  id: number;
  title: string;
  mediatorName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
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

type Tab = "exams" | "scores";

export default function StudentDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("exams");
  const [exams, setExams] = useState<Exam[]>([]);
  const [scores, setScores] = useState<Submission[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [error, setError] = useState("");

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "STUDENT")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load active exams on mount
  useEffect(() => {
    if (user && user.role === "STUDENT") loadExams();
  }, [user]);

  async function loadExams() {
    setLoadingExams(true);
    try {
      const data = await apiFetch<Exam[]>("/student/exams/active");
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exams");
    } finally {
      setLoadingExams(false);
    }
  }

  async function loadScores() {
    setLoadingScores(true);
    try {
      const data = await apiFetch<Submission[]>("/student/scores");
      setScores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scores");
    } finally {
      setLoadingScores(false);
    }
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    if (tab === "scores" && scores.length === 0) loadScores();
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) return null;
  if (!user || user.role !== "STUDENT") return null;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${
      activeTab === t
        ? "bg-gray-800 text-white"
        : "text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-gray-400">Welcome, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-0">
          <button onClick={() => switchTab("exams")} className={tabClass("exams")}>
            Active Exams
          </button>
          <button onClick={() => switchTab("scores")} className={tabClass("scores")}>
            My Scores
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-b-xl rounded-tr-xl p-6">
          {/* ====== ACTIVE EXAMS TAB ====== */}
          {activeTab === "exams" && (
            <div>
              {loadingExams ? (
                <p className="text-gray-500 text-sm">Loading exams...</p>
              ) : exams.length === 0 ? (
                <p className="text-gray-500 text-sm">No active exams available right now.</p>
              ) : (
                <div className="space-y-3">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-800/60 border border-gray-700/50 rounded-lg"
                    >
                      <div className="mb-2 md:mb-0">
                        <p className="font-medium">{exam.title}</p>
                        <p className="text-sm text-gray-400">
                          By {exam.mediatorName} &middot; {exam.durationMinutes} min
                        </p>
                        <p className="text-xs text-gray-500">
                          {fmtDate(exam.startTime)} → {fmtDate(exam.endTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/student/exams/${exam.id}`)}
                        className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-medium transition-colors cursor-pointer"
                      >
                        Take Exam
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== MY SCORES TAB ====== */}
          {activeTab === "scores" && (
            <div>
              {loadingScores ? (
                <p className="text-gray-500 text-sm">Loading scores...</p>
              ) : scores.length === 0 ? (
                <p className="text-gray-500 text-sm">No submissions yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-gray-400 text-sm font-medium">Exam</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Score</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50">
                        <td className="py-3">{s.examTitle}</td>
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
        </div>
      </div>
    </div>
  );
}
