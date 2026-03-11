import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    const remembered = localStorage.getItem('rememberMe') === 'true'

    if (remembered && savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.login(email, password)
      const { token, fullName, roles, ...userData } = response.data

      if (rememberMe) {
        localStorage.setItem('savedEmail', email)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('savedEmail')
        localStorage.removeItem('rememberMe')
      }

      const rawRoles = roles && roles.length > 0 ? roles : ['STUDENT']
      const normalizedRoles = rawRoles.map(r => r.replace('ROLE_', ''))
      const primaryRole = normalizedRoles[0]

      const user = {
        name: fullName || email,
        role: primaryRole,
        roles: normalizedRoles,
        ...userData
      }

      setAuth(token, user)
      toast.success(`Welcome, ${fullName || email}!`)

      if (primaryRole === 'SUPER_ADMIN' || primaryRole === 'MODERATOR') {
        navigate('/moderator/tests')
      } else {
        navigate('/student/tests')
      }
    } catch (error) {
      console.error('Login failed:', error)
      toast.error(error.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -trangray-x-1/2 -trangray-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Glassmorphic login card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-glass border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Mock<span className="text-blue-500">Test</span>
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-medium mb-2 text-gray-200 transition-colors group-focus-within:text-cyan-400">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="student@example.com"
                  required
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-400/0 group-focus-within:from-cyan-400/10 group-focus-within:via-blue-400/10 group-focus-within:to-purple-400/10 pointer-events-none transition-all duration-300"></div>
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-medium mb-2 text-gray-200 transition-colors group-focus-within:text-cyan-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none text-white placeholder-gray-400 pr-12 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -trangray-y-1/2 text-gray-400 hover:text-cyan-400 text-xl transition-colors duration-300"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-400/0 group-focus-within:from-cyan-400/10 group-focus-within:via-blue-400/10 group-focus-within:to-purple-400/10 pointer-events-none transition-all duration-300"></div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-300 cursor-pointer hover:text-white transition-colors group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer transition-all"
                />
                <span className="group-hover:text-cyan-400 transition-colors">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
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
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
