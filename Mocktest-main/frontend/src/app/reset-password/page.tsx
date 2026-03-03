"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
  if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
  if (score === 3) return { label: "Good", color: "bg-blue-500", width: "75%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = getStrength(newPassword);
  const mismatch = confirm.length > 0 && newPassword !== confirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Reset failed. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Password updated!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-block w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Set new password</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {/* Strength bar */}
          {newPassword.length > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-gray-700">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs mt-1 text-gray-400">
                Strength: <span className="font-medium text-white">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
                mismatch
                  ? "border-red-600 focus:ring-red-500"
                  : "border-gray-700 focus:ring-blue-500"
              }`}
              placeholder="Re-enter password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {mismatch && (
            <p className="text-xs mt-1 text-red-400">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || mismatch}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
          Back to Sign In
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8">
        <Suspense fallback={<p className="text-gray-400 text-center">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
