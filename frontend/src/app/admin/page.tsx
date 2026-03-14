"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Department {
  id: number;
  name: string;
}

interface Mediator {
  id: number;
  name: string;
  email: string;
  departmentName: string;
  departmentId: number;
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

  // Mediator registration / edit form state
  const [mediators, setMediators] = useState<Mediator[]>([]);
  const [fetchingMediators, setFetchingMediators] = useState(true);
  const [medName, setMedName] = useState("");
  const [medEmail, setMedEmail] = useState("");
  const [medPassword, setMedPassword] = useState("");
  const [medDeptId, setMedDeptId] = useState<number | "">("");
  const [editingMediatorId, setEditingMediatorId] = useState<number | null>(null);
  const [registeringSaving, setRegisteringSaving] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Auth guard
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "ADMIN") {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Fetch initial data
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      loadDepartments();
      loadMediators();
    }
  }, [user]);

  async function loadMediators() {
    setFetchingMediators(true);
    try {
      const data = await apiFetch<Mediator[]>("/admin/mediators");
      setMediators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mediators");
    } finally {
      setFetchingMediators(false);
    }
  }

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
      if (editingMediatorId !== null) {
        // Update
        const updated = await apiFetch<Mediator>(`/admin/mediators/${editingMediatorId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: medName,
            email: medEmail,
            password: medPassword || undefined, // Send only if changed
            role: "MEDIATOR",
            departmentId: user?.departmentId || medDeptId,
          }),
        });
        setMediators((prev) =>
          prev.map((m) => (m.id === editingMediatorId ? updated : m))
        );
        setRegisterSuccess("Mediator updated successfully");
        cancelEditMediator();
      } else {
        // Create
        await apiFetch<string>("/admin/register-mediator", {
          method: "POST",
          body: JSON.stringify({
            name: medName,
            email: medEmail,
            password: medPassword,
            role: "MEDIATOR",
            departmentId: user?.departmentId,
          }),
        });
        setRegisterSuccess("Mediator registered successfully");
        loadMediators(); // Refresh list
        setMedName("");
        setMedEmail("");
        setMedPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setRegisteringSaving(false);
    }
  }

  async function handleDeleteMediator(id: number) {
    if (!confirm("Delete this mediator account? All their exams will remain but they won't be able to log in.")) return;
    setError("");
    try {
      await apiFetch(`/admin/mediators/${id}`, { method: "DELETE" });
      setMediators((prev) => prev.filter((m) => m.id !== id));
      if (editingMediatorId === id) cancelEditMediator();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEditMediator(m: Mediator) {
    setEditingMediatorId(m.id);
    setMedName(m.name);
    setMedEmail(m.email);
    setMedPassword(""); // Don't show hashed password
    setMedDeptId(m.departmentId);
    setRegisterSuccess("");
    setError("");
  }

  function cancelEditMediator() {
    setEditingMediatorId(null);
    setMedName("");
    setMedEmail("");
    setMedPassword("");
    setMedDeptId("");
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
            <div className="flex flex-col">
              <p className="text-gray-400">Welcome, {user.name}</p>
              {user.departmentName && (
                <p className="text-blue-400 text-sm font-semibold">College: {user.departmentName}</p>
              )}
            </div>
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

        {/* Department Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">College Information</h2>
          {user.departmentName ? (
            <div className="flex items-center gap-4">
               <div>
                 <p className="text-sm text-gray-400">Name</p>
                 <p className="text-white font-medium">{user.departmentName}</p>
               </div>
               <div className="ml-8">
                 <p className="text-sm text-gray-400">Status</p>
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-900/40 text-green-300 border border-green-800/50">
                   Active
                 </span>
               </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No college information available.</p>
          )}
        </div>

        {/* Mediator Registration / Edit */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingMediatorId ? "Edit Mediator" : "Register Mediator"}</h2>
            {editingMediatorId && (
              <button
                onClick={cancelEditMediator}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
               >
                Cancel Edit
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Mediators will be automatically assigned to <strong>{user.departmentName || "your college"}</strong>.
          </p>
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
              required={!editingMediatorId}
              value={medPassword}
              onChange={(e) => setMedPassword(e.target.value)}
              placeholder={editingMediatorId ? "New Password (optional)" : "Password"}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={registeringSaving}
                className={`px-6 py-2 rounded-lg ${editingMediatorId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} disabled:opacity-50 font-medium text-sm transition-colors cursor-pointer disabled:cursor-not-allowed`}
              >
                {registeringSaving ? "Saving..." : editingMediatorId ? "Update Mediator" : "Register Mediator"}
              </button>
            </div>
          </form>
        </div>

        {/* Mediators List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Mediators</h2>
          {fetchingMediators ? (
            <p className="text-gray-500 text-sm">Loading mediators...</p>
          ) : mediators.length === 0 ? (
            <p className="text-gray-500 text-sm">No mediators registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="pb-2 text-gray-400 text-sm font-medium">Name</th>
                    <th className="pb-2 text-gray-400 text-sm font-medium">Email</th>
                    <th className="pb-2 text-gray-400 text-sm font-medium">Department</th>
                    <th className="pb-2 text-gray-400 text-sm font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mediators.map((m) => (
                    <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 text-gray-200">{m.name}</td>
                      <td className="py-3 text-gray-400 text-sm">{m.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/40 text-blue-300 border border-blue-800/50">
                          {m.departmentName}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => startEditMediator(m)}
                          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMediator(m.id)}
                          className="px-3 py-1 rounded bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs font-medium transition-colors cursor-pointer border border-red-800/50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
