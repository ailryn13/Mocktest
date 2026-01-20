import { useModeratorStore } from '../../store/moderatorStore'
import StudentCard from './StudentCard'
import { Users } from 'lucide-react'

export default function StudentGrid({ onSelectStudent }) {
  const { getFilteredStudents } = useModeratorStore()
  const students = getFilteredStudents()

  if (students.length === 0) {
    return (
      <div className="prof-panel p-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <Users size={32} className="text-slate-700" />
        </div>
        <h3 className="text-lg font-semibold text-white">No candidates found</h3>
        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
          <Users size={16} className="text-indigo-400" />
          <span>Active Candidates ({students.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-450px)]">
        {students.map((student) => (
          <StudentCard
            key={student.studentId}
            student={student}
            onClick={() => onSelectStudent(student)}
          />
        ))}
      </div>
    </div>
  )
}
