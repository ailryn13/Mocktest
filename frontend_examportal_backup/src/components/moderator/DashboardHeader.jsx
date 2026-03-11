import { Activity, Layout, Home, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardHeader({ examTitle, isConnected }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 mb-8">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
              <Layout size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Exam <span className="text-blue-400">Proctor</span>
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-medium text-gray-500 truncate max-w-[200px]">
                  {examTitle || 'Loading active session...'}
                </p>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-800 mx-2" />

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
              {isConnected ? 'LIVE FEED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm">
            {isConnected ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="text-rose-500" />
            )}
            <span className={`font-medium ${isConnected ? 'text-gray-400' : 'text-rose-400'}`}>
              {isConnected ? 'All systems nominal' : 'Connectivity issues detected'}
            </span>
          </div>

          <button
            onClick={() => navigate('/moderator/tests')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-lg transition-all"
          >
            <Home size={18} />
            <span className="text-sm font-semibold">Dashboard</span>
          </button>
        </div>
      </div>
    </header>
  )
}
