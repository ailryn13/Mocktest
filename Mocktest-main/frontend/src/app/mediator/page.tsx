"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Department {
  id: number;
  name: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  department: string;
}

interface Department {
  id: number;
  name: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  department: string;
}

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

  // Exam form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [examType, setExamType] = useState("MCQ");
  const [saving, setSaving] = useState(false);

  // Students state
  const [activeTab, setActiveTab] = useState<"exams" | "students">("exams");
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sDeptId, setSDeptId] = useState("");
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [studentSuccess, setStudentSuccess] = useState("");

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "MODERATOR")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch exams
  useEffect(() => {
    if (user && user.role === "MODERATOR") loadExams();
  }, [user]);

  // Fetch students + departments when tab is opened
  useEffect(() => {
    if (activeTab === "students" && user && user.role === "MODERATOR" && !studentsLoaded) {
      loadStudents();
    }
  }, [activeTab, user]);

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

  async function loadStudents() {
    try {
      const [studs, depts] = await Promise.all([
        apiFetch<Student[]>("/mediator/students"),
        apiFetch<Department[]>("/mediator/departments"),
      ]);
      setStudents(studs);
      setDepartments(depts);
      setStudentsLoaded(true);
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : "Failed to load students");
    }
  }

  function resetStudentForm() {
    setSName(""); setSEmail(""); setSPassword(""); setSDeptId("");
    setStudentError(""); setStudentSuccess("");
    setShowStudentForm(false);
  }

  async function handleStudentSubmit(e: FormEvent) {
    e.preventDefault();
    setStudentError(""); setStudentSuccess("");
    setStudentSaving(true);
    try {
      await apiFetch<string>("/mediator/register-student", {
        method: "POST",
        body: JSON.stringify({
          name: sName,
          email: sEmail,
          password: sPassword,
          role: "STUDENT",
          departmentId: Number(sDeptId),
        }),
      });
      setStudentSuccess(`Student "${sName}" registered successfully!`);
      setStudentsLoaded(false); // refresh list
      resetStudentForm();
      setShowStudentForm(false);
      loadStudents();
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setStudentSaving(false);
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
  if (!user || user.role !== "MODERATOR") return null;

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

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-5 py-2 rounded-t-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "exams"
                ? "bg-gray-900 border border-b-0 border-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            My Exams
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-5 py-2 rounded-t-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "students"
                ? "bg-gray-900 border border-b-0 border-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Students
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* â”€â”€ EXAMS TAB â”€â”€ */}
        {activeTab === "exams" && (
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
                    <option value="MCQ">MCQ â€“ Multiple Choice Only</option>
                    <option value="CODING">CODING â€“ Coding Problems Only</option>
                    <option value="HYBRID">HYBRID â€“ MCQ + Coding (mixed)</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Update Exam"}
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
                        {fmtDate(exam.startTime)} â†’ {fmtDate(exam.endTime)} &middot; {exam.durationMinutes} min
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
        )}

        {/* â”€â”€ STUDENTS TAB â”€â”€ */}
        {activeTab === "students" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Students</h2>
              <button
                onClick={() => { setShowStudentForm(true); setStudentError(""); setStudentSuccess(""); }}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-medium transition-colors cursor-pointer"
              >
                + Register Student
              </button>
            </div>

            {/* Success banner */}
            {studentSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-900/50 border border-green-700 text-green-300 text-sm">
                {studentSuccess}
              </div>
            )}

            {/* Register Student Form */}
            {showStudentForm && (
              <form onSubmit={handleStudentSubmit} className="mb-6 p-4 bg-gray-800 rounded-lg space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">New Student Account</h3>
                {studentError && (
                  <div className="p-2 rounded bg-red-900/50 border border-red-700 text-red-300 text-xs">
                    {studentError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. Ravi Kumar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={sPassword}
                      onChange={(e) => setSPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Department</label>
                    <select
                      required
                      value={sDeptId}
                      onChange={(e) => setSDeptId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={studentSaving}
                    className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {studentSaving ? "Registering..." : "Register Student"}
                  </button>
                  <button
                    type="button"
                    onClick={resetStudentForm}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Student list */}
            {!studentsLoaded ? (
              <p className="text-gray-500 text-sm">Loading students...</p>
            ) : students.length === 0 ? (
              <p className="text-gray-500 text-sm">No students registered yet. Use the button above to add one.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-2 pr-4 font-medium">{s.name}</td>
                        <td className="py-2 pr-4 text-gray-400">{s.email}</td>
                        <td className="py-2 text-gray-400">{s.department || "â€”"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

