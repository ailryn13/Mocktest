"use client";

import { useAuth } from "@/context/AuthContext";
import { getDepartments, createDepartment, createDepartmentAdmin, Department } from "@/lib/superAdminApi";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

export default function SuperAdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "SUPER_ADMIN") {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "SUPER_ADMIN") {
      loadDepartments();
    }
  }, [user]);

  async function loadDepartments() {
    setFetching(true);
    setError("");
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setFetching(false);
    }
  }

  async function handleCreateDepartment(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingDept(true);
    try {
      const created = await createDepartment({ name: deptName, description: deptDesc });
      setDepartments((prev) => [...prev, created]);
      setSuccess("College created successfully.");
      closeDeptModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create college");
    } finally {
      setSavingDept(false);
    }
  }

  function openAdminModal(deptId: number) {
    setSelectedDeptId(deptId);
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setShowAdminModal(true);
  }

  function closeAdminModal() {
    setShowAdminModal(false);
    setSelectedDeptId(null);
  }

  function closeDeptModal() {
    setShowDeptModal(false);
    setDeptName("");
    setDeptDesc("");
  }

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();
    if (selectedDeptId === null) return;
    setError("");
    setSuccess("");
    setSavingAdmin(true);
    try {
      await createDepartmentAdmin(selectedDeptId, {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });
      setSuccess("Admin created successfully.");
      closeAdminModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setSavingAdmin(false);
    }
  }

  if (loading) return null;
  if (!user || user.role !== "SUPER_ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            <p className="text-gray-400">Welcome, {user.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Banners */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-900/50 border border-green-700 text-green-300 text-sm">
            {success}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Colleges</h2>
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium text-sm transition-colors cursor-pointer"
            >
              + Create College
            </button>
          </div>

          {/* Department list */}
          {fetching ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : departments.length === 0 ? (
            <p className="text-gray-500 text-sm">No colleges yet.</p>
          ) : (
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="pb-2 text-gray-400 text-sm font-medium">ID</th>
                    <th className="pb-2 text-gray-400 text-sm font-medium">Name</th>
                    <th className="pb-2 text-gray-400 text-sm font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={dept.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 text-gray-300">{index + 1}</td>
                      <td className="py-3 font-medium text-gray-200">{dept.name}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openAdminModal(dept.id)}
                          className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Add Admin
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

      {/* Create Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create College</h2>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeptModal}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {savingDept ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add College Admin</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAdminModal}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdmin}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {savingAdmin ? "Saving..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
