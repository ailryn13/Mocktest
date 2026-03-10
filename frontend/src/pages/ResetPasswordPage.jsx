import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token') || ''

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Redirect if no token provided
    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token.')
            navigate('/forgot-password')
        }
    }, [token, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }
        setLoading(true)
        try {
            await authAPI.resetPassword(token, newPassword)
            setSuccess(true)
            toast.success('Password reset successfully!')
        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid or expired reset link.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const EyeToggle = ({ show, onToggle }) => (
        <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-300 focus:outline-none"
            aria-label={show ? 'Hide password' : 'Show password'}
        >
            {show ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.07 0 2.1.17 3.07.48M6.1 6.1l11.8 11.8M9.88 9.88A3 3 0 0014.12 14.12M3 3l18 18" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )}
        </button>
    )

    // Password strength
    const strength = (() => {
        if (!newPassword) return { label: '', color: '', width: '0%' }
        let score = 0
        if (newPassword.length >= 8) score++
        if (/[A-Z]/.test(newPassword)) score++
        if (/[0-9]/.test(newPassword)) score++
        if (/[^A-Za-z0-9]/.test(newPassword)) score++
        const map = [
            { label: 'Weak',   color: 'bg-red-500',    width: '25%' },
            { label: 'Fair',   color: 'bg-orange-500', width: '50%' },
            { label: 'Good',   color: 'bg-yellow-500', width: '75%' },
            { label: 'Strong', color: 'bg-green-500',  width: '100%' },
        ]
        return map[score - 1] || map[0]
    })()

    // -----------------------------------------------------------------------
    // Success screen
    // -----------------------------------------------------------------------
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                </div>
                <div className="relative z-10 w-full max-w-md">
                    <div className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20 text-center">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-400/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
                        <p className="text-gray-300 text-sm mb-8">
                            Your password has been updated successfully. You can now sign in with your new password.
                        </p>
                        <Link
                            to="/login"
                            className="relative block w-full py-3 rounded-lg font-semibold text-white text-center overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 group-hover:opacity-90 transition-opacity"></div>
                            <span className="relative z-10">Go to Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // -----------------------------------------------------------------------
    // Reset form
    // -----------------------------------------------------------------------
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500/20 border border-cyan-400/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Set New Password
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">
                            Choose a strong password for your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-200 transition-colors group-focus-within:text-cyan-400">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none text-white placeholder-gray-400 pr-12 transition-all duration-300"
                                    placeholder="Min. 8 characters"
                                    minLength={8}
                                    required
                                    autoFocus
                                />
                                <EyeToggle show={showNew} onToggle={() => setShowNew(v => !v)} />
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-400/0 group-focus-within:from-cyan-400/10 group-focus-within:via-blue-400/10 group-focus-within:to-purple-400/10 pointer-events-none transition-all duration-300"></div>
                            </div>
                            {/* Strength bar */}
                            {newPassword && (
                                <div className="mt-2">
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
                                    </div>
                                    <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-200 transition-colors group-focus-within:text-cyan-400">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border focus:ring-2 focus:outline-none text-white placeholder-gray-400 pr-12 transition-all duration-300 ${
                                        confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-500 focus:border-red-400 focus:ring-red-400/50'
                                            : 'border-white/10 focus:border-cyan-400 focus:ring-cyan-400/50'
                                    }`}
                                    placeholder="Repeat your password"
                                    required
                                />
                                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                                <div className="absolute inset-0 rounded-lg pointer-events-none"></div>
                            </div>
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || (confirmPassword && confirmPassword !== newPassword)}
                            className="relative w-full py-3 px-6 rounded-lg font-semibold text-white overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300 group-hover:scale-105"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative z-10 flex items-center justify-center">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
