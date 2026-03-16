"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onRefresh: () => void;
}

export default function BulkInviteModal({ isOpen, onClose, onSuccess, onRefresh }: BulkInviteModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // apiFetch doesn't handle FormData automatically with default headers
      // We need to use a specialized fetch or update apiFetch
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/mediator/bulk-invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      setResults(data);
      if (data.successCount > 0) {
        onSuccess(`Successfully invited ${data.successCount} students!`);
        onRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bulk Invite Students</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">✕</button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Upload an Excel (.xlsx) file with columns: <br />
          <code className="text-blue-400">Name | Department | Roll Number | Email</code>
        </p>

        {!results ? (
          <form onSubmit={handleUpload} className="space-y-6">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? "border-blue-500/50 bg-blue-500/5" : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
            }`}>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer block">
                <div className="text-4xl mb-3">📊</div>
                <div className="text-sm font-medium text-gray-200">
                  {file ? file.name : "Click to select Excel file"}
                </div>
                <div className="text-xs text-gray-500 mt-1">Maximum size 5MB</div>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer"
              >
                {uploading ? "Uploading..." : "Start Import"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <div className="text-2xl font-bold text-green-400">{results.successCount}</div>
                <div className="text-xs text-green-500 uppercase tracking-wider font-bold">Success</div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-2xl font-bold text-red-400">{results.failureCount}</div>
                <div className="text-xs text-red-500 uppercase tracking-wider font-bold">Failed</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto p-3 rounded-lg bg-gray-800 border border-gray-700 space-y-1">
                {results.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-400 flex gap-2">
                    <span>•</span> {err}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
