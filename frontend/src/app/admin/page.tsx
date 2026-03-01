"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Department {
  id: number;
  name: string;
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetching, setFetching] = useState(true);

  // Department form state
  const [deptName, setDeptName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Mediator registration form state
  const [medName, setMedName] = useState("");
  const [medEmail, setMedEmail] = useState("");
  const [medPassword, setMedPassword] = useState("");
  const [medDeptId, setMedDeptId] = useState<number | "">("");
  const [registeringSaving, setRegisteringSaving] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch departments
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      loadDepartments();
    }
  }, [user]);

  async function loadDepartments() {
    setFetching(true);
    try {
      const data = await apiFetch<Department[]>("/admin/departments");
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId !== null) {
        // Update
        const updated = await apiFetch<Department>(
          `/admin/departments/${editingId}`,
          { method: "PUT", body: JSON.stringify({ name: deptName }) }
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === editingId ? updated : d))
        );
      } else {
        // Create
        const created = await apiFetch<Department>("/admin/departments", {
          method: "POST",
          body: JSON.stringify({ name: deptName }),
        });
        setDepartments((prev) => [...prev, created]);
      }
      setDeptName("");
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this department?")) return;
    setError("");
    try {
      await apiFetch(`/admin/departments/${id}`, { method: "DELETE" });
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setDeptName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEdit(dept: Department) {
    setEditingId(dept.id);
    setDeptName(dept.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setDeptName("");
  }

  async function handleRegisterMediator(e: FormEvent) {
    e.preventDefault();
    setError("");
    setRegisterSuccess("");
    setRegisteringSaving(true);
    try {
      const msg = await apiFetch<string>("/admin/register-mediator", {
        method: "POST",
        body: JSON.stringify({
          name: medName,
          email: medEmail,
          password: medPassword,
          role: "MEDIATOR",
          departmentId: medDeptId,
        }),
      });
      setRegisterSuccess(typeof msg === "string" ? msg : "Mediator registered successfully");
      setMedName("");
      setMedEmail("");
      setMedPassword("");
      setMedDeptId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegisteringSaving(false);
    }
  }

  if (loading) return null;
  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
        {registerSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-900/50 border border-green-700 text-green-300 text-sm">
            {registerSuccess}
          </div>
        )}

        {/* Department Management */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Departments</h2>

          {/* Add / Edit form */}
          <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
            <input
              type="text"
              required
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="Department name"
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 font-medium text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Update"
                : "Add"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </form>

          {/* Department list */}
          {fetching ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="text-gray-500 text-sm">No departments yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pb-2 text-gray-400 text-sm font-medium">ID</th>
                  <th className="pb-2 text-gray-400 text-sm font-medium">Name</th>
                  <th className="pb-2 text-gray-400 text-sm font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-gray-800/50">
                    <td className="py-3 text-gray-300">{dept.id}</td>
                    <td className="py-3">{dept.name}</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => startEdit(dept)}
                        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Register Mediator */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Register Mediator</h2>
          <form onSubmit={handleRegisterMediator} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="Full Name"
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              required
              value={medEmail}
              onChange={(e) => setMedEmail(e.target.value)}
              placeholder="Email"
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              required
              value={medPassword}
              onChange={(e) => setMedPassword(e.target.value)}
              placeholder="Password"
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              required
              value={medDeptId}
              onChange={(e) => setMedDeptId(e.target.value ? Number(e.target.value) : "")}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={registeringSaving}
                className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 font-medium text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {registeringSaving ? "Registering..." : "Register Mediator"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
