"use client";

import { useState } from "react";
import { apiFetch, getApiBase } from "@/lib/api";

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
      const token = localStorage.getItem("token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/mediator/bulk-invite`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 transition-all duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transform animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Bulk Invite Students</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Required Columns</p>
          <div className="flex flex-wrap gap-2">
            {["Name", "Department", "Roll Number", "Email"].map((col) => (
              <span key={col} className="px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/20 text-blue-400 text-xs font-medium">
                {col}
              </span>
            ))}
          </div>
        </div>

        {!results ? (
          <form onSubmit={handleUpload} className="space-y-8">
            <div className={`group relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
              file 
                ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_-12px_rgba(59,130,246,0.3)]" 
                : "border-gray-800 hover:border-blue-500/30 hover:bg-gray-800/50 bg-gray-900"
            }`}>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer block">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  file ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400"
                }`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-base font-semibold text-white mb-1">
                  {file ? file.name : "Choose an Excel file"}
                </div>
                <div className="text-sm text-gray-500">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Excel spreadsheet up to 5MB"}
                </div>
              </label>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="flex-[1.5] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:scale-100 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : "Start Import"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 text-green-500 group-hover:scale-110 transition-transform">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-3xl font-black text-green-400 mb-1 leading-none">{results.successCount}</div>
                <div className="text-[10px] text-green-500 uppercase tracking-widest font-black">Success</div>
              </div>
              <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 text-red-500 group-hover:scale-110 transition-transform">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-3xl font-black text-red-400 mb-1 leading-none">{results.failureCount}</div>
                <div className="text-[10px] text-red-500 uppercase tracking-widest font-black">Failed</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Detail Errors</p>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {results.errors.map((err, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gray-800/50 border border-gray-800 text-[11px] text-red-400 flex gap-3 line-height-relaxed">
                      <span className="shrink-0 text-red-500/50">#{(i + 1).toString().padStart(2, '0')}</span> 
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Close Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
