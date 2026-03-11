import { Wifi, WifiOff, AlertCircle, User, Activity } from 'lucide-react'

export default function StudentCard({ student, onClick }) {
  const getStatusConfig = () => {
    if (student.activityStatus === 'TERMINATED') return {
      border: 'border-rose-500/50',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      statusClass: 'status-error'
    }

    switch (student.statusColor) {
      case 'GREEN':
        return { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/5', statusClass: 'status-active' }
      case 'YELLOW':
        return { border: 'border-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500/5', statusClass: 'status-warning' }
      case 'RED':
        return { border: 'border-rose-500/20', text: 'text-rose-400', bg: 'bg-rose-500/5', statusClass: 'status-error' }
      default:
        return { border: 'border-gray-800', text: 'text-gray-400', bg: 'bg-gray-900/40', statusClass: '' }
    }
  }

  const config = getStatusConfig()

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'No data'
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      onClick={student.activityStatus !== 'TERMINATED' ? onClick : undefined}
      className={`group relative prof-panel p-4 overflow-hidden transition-all duration-200 ${student.activityStatus === 'TERMINATED' ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:border-gray-700'
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center`}>
            <User size={18} className={config.text} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">
              {student.studentName}
            </h3>
            <p className="text-[11px] font-medium text-gray-500 tabular-nums">
              ID: {student.studentId}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {student.connectionStatus === 'CONNECTED' ? (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <Wifi size={12} className="text-emerald-400" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
              <WifiOff size={12} className="text-rose-400" />
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            </div>
          )}
        </div>
      </div>

      {/* Info Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Department</p>
          <p className="text-xs font-medium text-gray-300">{student.department || 'N/A'}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Last Activity</p>
          <p className="text-xs font-medium text-gray-300">{formatLastActivity(student.lastActivity)}</p>
        </div>
      </div>

      {/* Violations */}
      <div className="pt-3 border-t border-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-gray-500">
            <AlertCircle size={12} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Violations</span>
          </div>
          <span className={`text-[10px] font-bold ${student.violationCount >= 4 ? 'text-rose-400' :
              student.violationCount >= 2 ? 'text-amber-400' :
                'text-emerald-400'
            }`}>
            {student.violationCount} / 5
          </span>
        </div>

        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < student.violationCount
                  ? student.violationCount >= 4 ? 'bg-rose-500' :
                    student.violationCount >= 2 ? 'bg-amber-500' :
                      'bg-emerald-500'
                  : 'bg-gray-800'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Terminated Overlay */}
      {student.activityStatus === 'TERMINATED' && (
        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-[1px] flex items-center justify-center z-20">
          <div className="bg-rose-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg border border-white/20">
            Terminated
          </div>
        </div>
      )}
    </div>
  )
}
