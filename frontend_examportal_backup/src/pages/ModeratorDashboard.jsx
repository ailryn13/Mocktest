import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useModeratorStore } from '../store/moderatorStore'
import { useModeratorWebSocket } from '../hooks/useModeratorWebSocket'
import DashboardHeader from '../components/moderator/DashboardHeader'
import StatsOverview from '../components/moderator/StatsOverview'
import StudentGrid from '../components/moderator/StudentGrid'
import ViolationLog from '../components/moderator/ViolationLog'
import StudentDetailModal from '../components/moderator/StudentDetailModal'
import FilterBar from '../components/moderator/FilterBar'
import { violationAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ModeratorDashboard() {
  const { examId } = useParams()
  const {
    currentExamId,
    examTitle,
    stats,
    selectedStudent,
    setCurrentExam,
    setSelectedStudent,
  } = useModeratorStore()

  const [loading, setLoading] = useState(true)

  // WebSocket connection
  const { isConnected, sendTermination, sendWarning } = useModeratorWebSocket(examId)

  // Initialize dashboard
  useEffect(() => {
    async function init() {
      try {
        // Set exam
        setCurrentExam(examId, 'Signal Intelligence - Batch A-4')

        // Load initial violations
        const response = await violationAPI.getExamViolations(examId)
        // Process violations...

        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize dashboard:', error)
        toast.error('Failed to load dashboard')
      }
    }

    init()
  }, [examId])

  const handleTerminateStudent = async (studentId, reason) => {
    try {
      sendTermination(studentId, reason)
      toast.success('STUDENT VOIDED')
      setSelectedStudent(null)
    } catch (error) {
      toast.error('FAILURE TO VOID')
    }
  }

  const handleSendWarning = async (studentId, message) => {
    try {
      sendWarning(studentId, message)
      toast.success('INTERCEPT SENT')
    } catch (error) {
      toast.error('FAILURE TO SEND')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="prof-spinner" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest animate-pulse">Initializing Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      <DashboardHeader
        examTitle={examTitle}
        isConnected={isConnected}
      />

      <main className="max-w-[1600px] mx-auto px-6 pb-20">
        <div className="mb-8">
          <StatsOverview stats={stats} />
        </div>

        <div className="space-y-8">
          <FilterBar />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - 3/4 width */}
            <div className="lg:col-span-3">
              <StudentGrid onSelectStudent={setSelectedStudent} />
            </div>

            {/* Sidebar - 1/4 width */}
            <div className="lg:col-span-1">
              <ViolationLog />
            </div>
          </div>
        </div>
      </main>

      {/* Detail Overlay */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onTerminate={handleTerminateStudent}
          onSendWarning={handleSendWarning}
        />
      )}
    </div>
  )
}
