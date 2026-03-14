"use client";

import { useAuth } from "@/context/AuthContext";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, toggleDepartmentStatus, Department } from "@/lib/superAdminApi";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

export default function SuperAdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Department + Admin Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editDeptId, setEditDeptId] = useState<number | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptAddress, setDeptAddress] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [savingDept, setSavingDept] = useState(false);

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
      const payload = { 
        name: deptName, 
        description: deptDesc,
        address: deptAddress,
        code: deptCode,
        adminName: adminName,
        adminEmail: adminEmail,
        adminPassword: adminPassword
      };

      if (editDeptId) {
        const updated = await updateDepartment(editDeptId, payload);
        setDepartments((prev) => prev.map(d => d.id === editDeptId ? updated : d));
        setSuccess("College updated successfully.");
      } else {
        const created = await createDepartment(payload);
        setDepartments((prev) => [...prev, created]);
        setSuccess("College created successfully.");
      }
      closeDeptModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create college");
    } finally {
      setSavingDept(false);
    }
  }

  function openEditModal(dept: Department) {
    setEditDeptId(dept.id);
    setDeptName(dept.name || "");
    setDeptDesc(""); // Description wasn't fetched in previous version so leave blank
    setDeptAddress(dept.address || "");
    setDeptCode(dept.code || "");
    setAdminName(dept.adminName || "");
    setAdminEmail(dept.adminEmail || "");
    setAdminPassword(""); // leave blank unless changing
    setShowDeptModal(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to permanently delete this College and all its associated users?")) return;
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      setSuccess("College deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete college.");
    }
  }

  async function handleToggleStatus(id: number, currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'block' : 'unblock'} this College?`)) return;
    try {
      const updated = await toggleDepartmentStatus(id, !currentStatus);
      setDepartments(prev => prev.map(d => d.id === id ? updated : d));
      setSuccess(`College ${!currentStatus ? 'activated' : 'blocked'} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change status.");
    }
  }

  function closeDeptModal() {
    setShowDeptModal(false);
    setEditDeptId(null);
    setDeptName("");
    setDeptDesc("");
    setDeptAddress("");
    setDeptCode("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
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
                    <th className="pb-2 text-gray-400 text-sm font-medium">Status</th>
                    <th className="pb-2 text-gray-400 text-sm font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={dept.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 text-gray-300">{dept.id}</td>
                      <td className="py-3 font-medium text-gray-200">{dept.name}</td>
                      <td className="py-3 text-gray-300">
                        {dept.isActive ? (
                          <span className="px-2 py-1 bg-green-900/40 text-green-400 rounded-md text-xs font-medium border border-green-800/50">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-900/40 text-red-400 rounded-md text-xs font-medium border border-red-800/50">Inactive</span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-2 flex justify-end">
                        <button
                          onClick={() => openEditModal(dept)}
                          className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(dept.id, dept.isActive)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${dept.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {dept.isActive ? 'Block' : 'Unblock'}
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-xs font-medium transition-colors"
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

      {/* Create Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">{editDeptId ? 'Edit College' : 'Create College'}</h2>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={deptAddress}
                  onChange={(e) => setDeptAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px]"
                />
              </div>

              <hr className="border-gray-800 my-4" />
              <h3 className="text-lg font-semibold text-white">Admin Details</h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Admin Name</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Password {editDeptId && <span className="text-xs text-gray-500">(Leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      required={!editDeptId}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
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
                  {savingDept ? "Saving..." : (editDeptId ? "Save Changes" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
