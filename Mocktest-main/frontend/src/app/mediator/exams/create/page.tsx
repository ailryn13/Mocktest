"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

const LANGUAGES = ["Java", "Python", "C", "C++", "JavaScript"];

const KEYWORD_PRESETS = [
  { label: "No for loop",      value: "for" },
  { label: "No while loop",    value: "while" },
  { label: "No do-while",      value: "do" },
  { label: "No switch",        value: "switch" },
  { label: "No break",         value: "break" },
  { label: "No continue",      value: "continue" },
  { label: "No built-in sort", value: "sort" },
  { label: "No arrays/lists",  value: "array" },
];

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

  // Coding constraints
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
  const [bannedKeywords, setBannedKeywords]     = useState<string[]>([]);
  const [customKeyword, setCustomKeyword]       = useState("");
  const [mustUseRecursion, setMustUseRecursion] = useState(false);
  const [mustUseOOP, setMustUseOOP]             = useState(false);
  const [timeLimitSec, setTimeLimitSec]         = useState("5");
  const [memoryLimitMb, setMemoryLimitMb]       = useState("256");

  useEffect(() => {
    if (!loading && (!user || user.role !== "MEDIATOR")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user || user.role !== "MEDIATOR") return null;

  function toggleLanguage(lang: string) {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function toggleKeyword(kw: string) {
    setBannedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  }

  function addCustomKeyword() {
    const kw = customKeyword.trim().toLowerCase();
    if (kw && !bannedKeywords.includes(kw)) {
      setBannedKeywords((prev) => [...prev, kw]);
    }
    setCustomKeyword("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if ((examType === "CODING" || examType === "HYBRID") && allowedLanguages.length === 0) {
      setError("Please select at least one allowed language for coding.");
      return;
    }

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
          codingConstraints: (examType === "CODING" || examType === "HYBRID") ? {
            allowedLanguages,
            bannedKeywords,
            mustUseRecursion,
            mustUseOOP,
            timeLimitSeconds: Number(timeLimitSec),
            memoryLimitMb: Number(memoryLimitMb),
          } : null,
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

          {/* ── Section 2: Coding Constraints (only for CODING / HYBRID) ── */}
          {(examType === "CODING" || examType === "HYBRID") && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                Coding Constraints
              </h2>

              {/* Allowed Languages */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Allowed Languages <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                        allowedLanguages.includes(lang)
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                {allowedLanguages.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Students can only submit in:{" "}
                    <span className="text-blue-400">{allowedLanguages.join(", ")}</span>
                  </p>
                )}
              </div>

              {/* Banned Keywords */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Banned Keywords / Constructs
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {KEYWORD_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => toggleKeyword(preset.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors cursor-pointer ${
                        bannedKeywords.includes(preset.value)
                          ? "bg-red-700/50 border-red-600 text-red-200"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {bannedKeywords.includes(preset.value) ? "🚫 " : ""}{preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom keyword input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomKeyword())}
                    placeholder="Add custom banned keyword..."
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={addCustomKeyword}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {/* Active banned keyword chips */}
                {bannedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bannedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-900/40 border border-red-700 text-red-300 text-xs"
                      >
                        🚫 {kw}
                        <button
                          type="button"
                          onClick={() => toggleKeyword(kw)}
                          className="ml-1 hover:text-white cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Must-use Constraints */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Must-Use Constraints</label>
                <div className="flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={mustUseRecursion}
                      onChange={(e) => setMustUseRecursion(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Must use Recursion
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={mustUseOOP}
                      onChange={(e) => setMustUseOOP(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Must use OOP (class / object)
                    </span>
                  </label>
                </div>
              </div>

              {/* Time & Memory Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Time Limit (seconds)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={timeLimitSec}
                    onChange={(e) => setTimeLimitSec(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max time per test case run</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Memory Limit (MB)</label>
                  <input
                    type="number"
                    min={32}
                    max={512}
                    value={memoryLimitMb}
                    onChange={(e) => setMemoryLimitMb(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max memory per test case run</p>
                </div>
              </div>
            </div>
          )}

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
