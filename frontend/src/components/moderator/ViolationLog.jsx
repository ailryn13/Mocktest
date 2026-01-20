import { useModeratorStore } from '../../store/moderatorStore'
import { AlertTriangle, Clock, Activity, ShieldAlert, History } from 'lucide-react'

export default function ViolationLog() {
  const { recentViolations } = useModeratorStore()

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getViolationStyles = (type) => {
    switch (type) {
      case 'PHONE_DETECTED':
      case 'MULTIPLE_FACES':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
      case 'TAB_SWITCH':
      case 'WINDOW_BLUR':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
      default:
        return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
    }
  }

  return (
    <aside className="prof-panel h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center space-x-2 text-slate-300">
          <History size={14} className="text-indigo-400" />
          <span>Activity Log</span>
        </h2>
        <div className="flex items-center space-x-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 prof-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {recentViolations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-10">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-4 opacity-50">
              <ShieldAlert size={32} className="text-slate-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 text-center">
              No recent activity recorded.<br />Monitoring is active.
            </p>
          </div>
        ) : (
          recentViolations.map((violation, index) => {
            const styles = getViolationStyles(violation.violationType)
            return (
              <div
                key={index}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-white truncate">
                      {violation.studentName || `ID: ${violation.studentId}`}
                    </p>
                    <p className={`text-[10px] font-bold tracking-wide ${styles.text} uppercase mt-0.5`}>
                      {violation.violationType?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-medium text-slate-500 tabular-nums">
                    <Clock size={10} />
                    <span>{formatTime(violation.timestamp)}</span>
                  </div>
                </div>

                <div className={`p-2 rounded-md ${styles.bg} border ${styles.border} mb-2`}>
                  <p className="text-[11px] font-medium text-slate-300 leading-relaxed italic">
                    {violation.message}
                  </p>
                </div>

                {violation.totalStrikes !== undefined && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Accumulated Strikes</span>
                    <div className="flex space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-3 rounded-full ${i < violation.totalStrikes
                            ? violation.totalStrikes >= 4
                              ? 'bg-rose-500'
                              : violation.totalStrikes >= 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            : 'bg-slate-800'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="p-3 bg-slate-900/80 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center space-x-1">
            <Activity size={10} className="text-indigo-500" />
            <span>Encrypted Stream</span>
          </span>
          <span className="opacity-50">v2.4.0-pro</span>
        </div>
      </div>
    </aside>
  )
}
