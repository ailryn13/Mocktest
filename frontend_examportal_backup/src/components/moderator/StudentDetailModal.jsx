import { X, AlertTriangle, Camera, Clock, User, ShieldAlert, Activity, Send, UserX } from 'lucide-react'
import { useState } from 'react'

export default function StudentDetailModal({ student, onClose, onTerminate, onSendWarning }) {
  const [terminateReason, setTerminateReason] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false)

  const handleTerminate = () => {
    if (!terminateReason.trim()) return
    onTerminate(student.studentId, terminateReason)
    setShowTerminateConfirm(false)
  }

  const handleWarning = () => {
    if (!warningMessage.trim()) return
    onSendWarning(student.studentId, warningMessage)
    setWarningMessage('')
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'No data'
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
      hour12: false
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="prof-panel max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <User size={32} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {student.studentName}
              </h2>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Candidate ID: <span className="font-mono text-gray-400">{student.studentId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <Activity size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Connection Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${student.connectionStatus === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                <p className={`text-base font-semibold ${student.connectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {student.connectionStatus}
                </p>
              </div>
            </div>

            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Violation Level</span>
              </div>
              <p className={`text-base font-semibold ${student.violationCount >= 4 ? 'text-rose-400' : student.violationCount >= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {student.violationCount} / 5 Violations
              </p>
            </div>

            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Department</span>
              </div>
              <p className="text-base font-semibold text-gray-300">
                {student.department || 'General'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Monitoring */}
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden aspect-video relative group">
                <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-md">Live Stream</span>
                </div>

                <div className="h-full w-full flex flex-col items-center justify-center bg-gray-950/50">
                  <Camera size={40} className="text-gray-800 mb-2" />
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">Feed Initializing...</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                  <Clock size={14} className="text-blue-400" />
                  <span>Administrative Logs</span>
                </h3>
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Last Activity Detected</span>
                    <span className="text-gray-300 font-medium tabular-nums">{formatTime(student.lastActivity)}</span>
                  </div>
                  <div className="h-px bg-gray-800" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Session Join Time</span>
                    <span className="text-gray-300 font-medium tabular-nums">{formatTime(student.lastHeartbeat)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {student.activityStatus !== 'TERMINATED' ? (
                <div className="space-y-6">
                  {/* Warning */}
                  <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 border-l-4 border-l-amber-500/50">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                      <Send size={14} />
                      <span>Issue Warning</span>
                    </h3>
                    <textarea
                      value={warningMessage}
                      onChange={(e) => setWarningMessage(e.target.value)}
                      placeholder="Type a message to send to the candidate..."
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-amber-500/50 transition-all resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleWarning}
                      disabled={!warningMessage.trim()}
                      className="w-full mt-4 btn-primary bg-amber-600 hover:bg-amber-700 shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <span className="text-xs">Send Warning Signal</span>
                    </button>
                  </div>

                  {/* Termination */}
                  <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 border-l-4 border-l-rose-500/50">
                    <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                      <UserX size={14} />
                      <span>Restrict Access</span>
                    </h3>

                    {!showTerminateConfirm ? (
                      <button
                        onClick={() => setShowTerminateConfirm(true)}
                        className="w-full btn-danger text-xs"
                      >
                        Terminate Examination
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={terminateReason}
                          onChange={(e) => setTerminateReason(e.target.value)}
                          placeholder="State reason for termination (required)..."
                          className="w-full px-4 py-3 bg-gray-900 border border-rose-500/30 rounded-lg text-sm text-white placeholder:text-rose-900/50 focus:border-rose-500 transition-all resize-none"
                          rows={2}
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={handleTerminate}
                            disabled={!terminateReason.trim()}
                            className="flex-1 btn-danger text-xs disabled:opacity-50"
                          >
                            Confirm Termination
                          </button>
                          <button
                            onClick={() => {
                              setShowTerminateConfirm(false)
                              setTerminateReason('')
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                    <ShieldAlert size={32} className="text-rose-500" />
                  </div>
                  <h2 className="text-lg font-bold text-rose-500 mb-2">Access Terminated</h2>
                  <p className="text-sm text-gray-500">
                    This candidate's session has been permanently closed by the proctor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
