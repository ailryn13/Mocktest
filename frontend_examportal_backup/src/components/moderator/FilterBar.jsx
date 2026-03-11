import { Search, Filter, SlidersHorizontal, Activity, Layers } from 'lucide-react'
import { useModeratorStore } from '../../store/moderatorStore'

export default function FilterBar() {
  const {
    filterStatus,
    searchQuery,
    selectedDepartment,
    setFilterStatus,
    setSearchQuery,
    setSelectedDepartment,
  } = useModeratorStore()

  return (
    <div className="prof-panel p-3">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative group">
          <div className="absolute left-3 top-1/2 -trangray-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search candidates by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900/40 border border-gray-800 rounded-lg text-sm placeholder:text-gray-600 focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block h-6 w-px bg-gray-800" />

          <div className="flex items-center space-x-2">
            {/* Status Select */}
            <div className="relative group/select">
              <div className="absolute left-3 top-1/2 -trangray-y-1/2 text-blue-400/70">
                <Activity size={14} />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-900/40 border border-gray-800 rounded-lg text-xs font-semibold text-gray-400 focus:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">ALL CANDIDATES</option>
                <option value="active">ONLINE ONLY</option>
                <option value="flagged">FLAGGED ONLY</option>
                <option value="terminated">TERMINATED</option>
              </select>
              <div className="absolute right-3 top-1/2 -trangray-y-1/2 pointer-events-none text-gray-600">
                <SlidersHorizontal size={12} />
              </div>
            </div>

            {/* Department Select */}
            <div className="relative group/select">
              <div className="absolute left-3 top-1/2 -trangray-y-1/2 text-sky-400/70">
                <Layers size={14} />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-900/40 border border-gray-800 rounded-lg text-xs font-semibold text-gray-400 focus:text-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">ALL DEPARTMENTS</option>
                <option value="CSE">COMPUTER SCIENCE</option>
                <option value="ECE">ELECTRONICS</option>
                <option value="MECH">MECHANICAL</option>
                <option value="CIVIL">CIVIL ENG</option>
              </select>
              <div className="absolute right-3 top-1/2 -trangray-y-1/2 pointer-events-none text-gray-600">
                <SlidersHorizontal size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
