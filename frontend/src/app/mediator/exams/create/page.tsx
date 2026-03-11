"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

export default function CreateExamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle]                     = useState("");
  const [startTime, setStartTime]             = useState("");
  const [endTime, setEndTime]                 = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [examType, setExamType]               = useState("MCQ");
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState("");

  useEffect(() => {
    if (!loading) {
      const role = user?.role?.toUpperCase();
      if (!user || (role !== "MEDIATOR" && role !== "MODERATOR")) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) return null;
  const userRole = user?.role?.toUpperCase();
  if (!user || (userRole !== "MEDIATOR" && userRole !== "MODERATOR")) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await apiFetch<{ id: number }>("/mediator/exams", {
        method: "POST",
        body: JSON.stringify({
          title,
          startTime,
          endTime,
          durationMinutes: Number(durationMinutes),
          examType,
        }),
      });
      router.push(`/mediator/exams/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-white">Create New Test</h1>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Section 1: Test Details ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Test Details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Test Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Java Mid-Term Exam"
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Start / End time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition scheme-dark"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">
                  End Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition scheme-dark"
                />
              </div>
            </div>

            {/* Duration / Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Duration (mins)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Test Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                >
                  <option value="MCQ">MCQ Only</option>
                  <option value="CODING">Coding Only</option>
                  <option value="HYBRID">MCQ + Coding (Hybrid)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-blue-700/20"
            >
              {saving ? "Creating..." : "Create Test"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
