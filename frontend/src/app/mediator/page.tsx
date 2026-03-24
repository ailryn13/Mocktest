"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import BulkInviteModal from "@/components/BulkInviteModal";

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
  const [showBulkInvite, setShowBulkInvite] = useState(false);

  // Search & Reset
  const [studentSearch, setStudentSearch] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading) {
      const role = user?.role?.toUpperCase();
      if (!user || (role !== "MEDIATOR" && role !== "MODERATOR")) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Fetch exams
  useEffect(() => {
    if (user && user.role === "MEDIATOR") loadExams();
  }, [user]);

  // Fetch students + departments when tab is opened
  useEffect(() => {
    if (activeTab === "students" && user && user.role === "MEDIATOR" && !studentsLoaded) {
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

      // Default to mediator's department if not already selected
      if (!sDeptId && user?.departmentId) {
        setSDeptId(String(user.departmentId));
      }
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : "Failed to load students");
    }
  }

  function resetStudentForm() {
    setSName(""); setSEmail(""); setSPassword("");
    setSDeptId(user?.departmentId ? String(user.departmentId) : "");
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

  async function handlePasswordReset(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !newPassword) return;
    setResetSaving(true);
    setStudentError("");
    try {
      await apiFetch(`/mediator/students/${selectedStudent.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ password: newPassword }),
      });
      setStudentSuccess(`Password updated for ${selectedStudent.name}`);
      setShowPasswordModal(false);
      setNewPassword("");
      setSelectedStudent(null);
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetSaving(false);
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

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
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const h12 = hours % 12 || 12;
    return `${day}/${month}/${year}, ${h12}:${mins} ${ampm}`;
  }

  if (loading) return null;
  const userRole = user?.role?.toUpperCase();
  if (!user || (userRole !== "MEDIATOR" && userRole !== "MODERATOR")) return null;

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
            className={`px-5 py-2 rounded-t-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === "exams"
                ? "bg-gray-900 border border-b-0 border-gray-700 text-white"
                : "text-gray-400 hover:text-white"
              }`}
          >
            My Exams
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-5 py-2 rounded-t-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === "students"
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

        {/* -- EXAMS TAB -- */}
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
                    <option value="MCQ">MCQ - Multiple Choice Only</option>
                    <option value="CODING">CODING - Coding Problems Only</option>
                    <option value="HYBRID">HYBRID - MCQ + Coding (mixed)</option>
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
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded font-semibold ${exam.examType === "CODING" ? "bg-purple-700 text-purple-100" :
                            exam.examType === "HYBRID" ? "bg-amber-700 text-amber-100" :
                              "bg-blue-800 text-blue-100"
                          }`}>{exam.examType || "MCQ"}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Since {fmtDate(exam.startTime)} to {fmtDate(exam.endTime)} &middot; {exam.durationMinutes} min
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

        {/* -- STUDENTS TAB -- */}
        {activeTab === "students" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Students</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowBulkInvite(true); setStudentError(""); setStudentSuccess(""); }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk Invite
                </button>
                <button
                  onClick={() => { setShowStudentForm(true); setStudentError(""); setStudentSuccess(""); }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register Student
                </button>
              </div>
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
                      disabled
                      value={sDeptId}
                      onChange={(e) => setSDeptId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 focus:outline-none cursor-not-allowed"
                    >
                      <option value="">Select department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-gray-500">Fixed to your department</p>
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
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {!studentsLoaded ? (
              <p className="text-gray-500 text-sm">Loading students...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {studentSearch ? "No students match your search." : "No students registered yet. Use the button above to add one."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Department</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-2 pr-4 font-medium">{s.name}</td>
                        <td className="py-2 pr-4 text-gray-400">{s.email}</td>
                        <td className="py-2 pr-4 text-gray-400">{s.department || "—"}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => { setSelectedStudent(s); setShowPasswordModal(true); setStudentError(""); setStudentSuccess(""); }}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold mb-1">Reset Password</h3>
              <p className="text-sm text-gray-400 mb-4">Update password for <b>{selectedStudent.name}</b></p>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordModal(false); setSelectedStudent(null); setNewPassword(""); }}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSaving}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer"
                  >
                    {resetSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <BulkInviteModal
          isOpen={showBulkInvite}
          onClose={() => setShowBulkInvite(false)}
          onSuccess={(msg) => { setStudentSuccess(msg); setShowBulkInvite(false); }}
          onRefresh={loadStudents}
        />
      </div>
    </div>
  );
}

