"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Exam {
  id: number;
  title: string;
  mediatorName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  examType: string;
}

export default function MediatorDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [examType, setExamType] = useState("MCQ");
  const [saving, setSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "MEDIATOR")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch exams
  useEffect(() => {
    if (user && user.role === "MEDIATOR") loadExams();
  }, [user]);

  async function loadExams() {
    setFetching(true);
    try {
      const data = await apiFetch<Exam[]>("/mediator/exams");
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exams");
    } finally {
      setFetching(false);
    }
  }

  function resetForm() {
    setTitle("");
    setStartTime("");
    setEndTime("");
    setDurationMinutes("");
    setExamType("MCQ");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(exam: Exam) {
    setEditingId(exam.id);
    setTitle(exam.title);
    setStartTime(exam.startTime.slice(0, 16));
    setEndTime(exam.endTime.slice(0, 16));
    setDurationMinutes(String(exam.durationMinutes));
    setExamType(exam.examType || "MCQ");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = JSON.stringify({
      title,
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes),
      examType,
    });

    try {
      // Edit only — create is handled by /mediator/exams/create
      if (editingId !== null) {
        const updated = await apiFetch<Exam>(`/mediator/exams/${editingId}`, {
          method: "PUT",
          body,
        });
        setExams((prev) => prev.map((ex) => (ex.id === editingId ? updated : ex)));
        resetForm();
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this exam and all its questions?")) return;
    setError("");
    try {
      await apiFetch(`/mediator/exams/${id}`, { method: "DELETE" });
      setExams((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) return null;
  if (!user || user.role !== "MEDIATOR") return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mediator Dashboard</h1>
            <p className="text-gray-400">Welcome, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Exams section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Exams</h2>
            <button
              onClick={() => router.push("/mediator/exams/create")}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors cursor-pointer"
            >
              + New Exam
            </button>
          </div>

          {/* Edit Form */}
          {showForm && editingId !== null && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-800 rounded-lg space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Java Mid-Term"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="90"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MCQ">MCQ – Multiple Choice Only</option>
                  <option value="CODING">CODING – Coding Problems Only</option>
                  <option value="HYBRID">HYBRID – MCQ + Coding (mixed)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : editingId !== null ? "Update Exam" : "Create Exam"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Exam list */}
          {fetching ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : exams.length === 0 ? (
            <p className="text-gray-500 text-sm">No exams yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-800/60 border border-gray-700/50 rounded-lg"
                >
                  <div className="mb-2 md:mb-0">
                    <p className="font-medium">
                      {exam.title}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded font-semibold ${
                        exam.examType === "CODING" ? "bg-purple-700 text-purple-100" :
                        exam.examType === "HYBRID" ? "bg-amber-700 text-amber-100" :
                        "bg-blue-800 text-blue-100"
                      }`}>{exam.examType || "MCQ"}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      {fmtDate(exam.startTime)} → {fmtDate(exam.endTime)} &middot; {exam.durationMinutes} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/mediator/exams/${exam.id}`)}
                      className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => startEdit(exam)}
                      className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
