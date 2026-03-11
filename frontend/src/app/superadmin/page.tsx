"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface College {
  id: number;
  name: string;
  code: string;
  location: string;
  adminEmail?: string;
  adminName?: string;
}

interface NewCollegeForm {
  name: string;
  code: string;
  location: string;
}

export default function SuperAdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [fetchingColleges, setFetchingColleges] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch colleges on mount
  useEffect(() => {
    if (user && user.role === "SUPER_ADMIN") {
      loadColleges();
    }
  }, [user]);

  async function loadColleges() {
    setFetchingColleges(true);
    try {
      const data = await apiFetch<College[]>("/superadmin/colleges");
      setColleges(data);
    } catch (err) {
      console.error("Failed to load colleges:", err);
      setColleges([]);
    } finally {
      setFetchingColleges(false);
    }
  }

  if (loading) return null;
  if (!user || user.role !== "SUPER_ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Welcome, {user.name} - System Administrator</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatCard
            title="Total Colleges"
            value={fetchingColleges ? "..." : colleges.length.toString()}
            icon="🏛️"
            color="blue"
          />
        </div>

        {/* College Management */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-3xl">🏛️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">College Management</h3>
              <p className="text-gray-400 text-sm">Create and manage colleges, assign administrators</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowViewModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors cursor-pointer"
            >
              View Colleges
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Add College
            </button>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-3xl">👥</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">User Management</h3>
              <p className="text-gray-400 text-sm">Create admin users and assign them to colleges</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Create Admin User
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddAdminUserModal
          colleges={colleges}
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => {
            setShowAddUserModal(false);
          }}
        />
      )}

      {/* View Colleges Modal */}
      {showViewModal && (
        <ViewCollegesModal
          colleges={colleges}
          onClose={() => setShowViewModal(false)}
          onRefresh={loadColleges}
        />
      )}

      {/* Add College Modal */}
      {showAddModal && (
        <AddCollegeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadColleges();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colorClasses = {
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-cyan-600",
    purple: "from-purple-500 to-pink-600",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ViewCollegesModal({ colleges, onClose, onRefresh }: { colleges: College[]; onClose: () => void; onRefresh: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Colleges</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {colleges.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏛️</div>
              <p className="text-gray-400 text-lg">No colleges found</p>
              <p className="text-gray-500 text-sm mt-2">Create your first college to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {colleges.map((college) => (
                <div key={college.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{college.name}</h3>
                      <div className="space-y-1 text-sm text-gray-400">
                        <p><span className="text-gray-500">Code:</span> {college.code}</p>
                        <p><span className="text-gray-500">Location:</span> {college.location}</p>
                        {college.adminEmail && (
                          <p><span className="text-gray-500">Admin:</span> {college.adminName || college.adminEmail}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCollegeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<NewCollegeForm>({
    name: "",
    code: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("College name is required");
      return;
    }
    if (!formData.code.trim()) {
      setError("College code is required");
      return;
    }
    if (!formData.location.trim()) {
      setError("Location is required");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/superadmin/colleges", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      
      alert(`College "${formData.name}" created successfully!`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create college");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add New College</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* College Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                College Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., MIT Engineering College"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* College Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                College Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., MIT-001"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500 uppercase"
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Location / Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., 123 University Road, Chennai, Tamil Nadu"
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create College"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddAdminUserModal({ colleges, onClose, onSuccess }: { colleges: College[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    collegeId: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Invalid email format");
      return;
    }
    if (!formData.collegeId) {
      setError("Please select a college");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        collegeId: parseInt(formData.collegeId),
      };

      await apiFetch("/admin/users/create-admin", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      alert(`Admin user "${formData.username}" created successfully!\nEmail: ${formData.email}\nPassword: ${formData.password}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
          <h2 className="text-2xl font-bold">Create Admin User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g., admin.johnson"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., admin@college.edu"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This password will be displayed once. Make sure to save it.
              </p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g., John"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g., Johnson"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +91 9876543210"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* College */}
            <div>
              <label htmlFor="collegeId" className="block text-sm font-medium mb-2">
                Assign to College <span className="text-red-500">*</span>
              </label>
              <select
                id="collegeId"
                name="collegeId"
                value={formData.collegeId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={loading}
              >
                <option value="">-- Select College --</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Department (Optional) */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium mb-2">
                Department (Optional)
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., Computer Science"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

