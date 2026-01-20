import { Users, UserCheck, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'

export default function StatsOverview({ stats }) {
  const statCards = [
    {
      label: 'Session Total',
      value: stats.totalStudents,
      sublabel: 'Total candidates enrolled',
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Currently Active',
      value: stats.activeStudents,
      sublabel: 'Live connections active',
      icon: UserCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Flagged Activity',
      value: stats.flaggedStudents,
      sublabel: 'Requires attention',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Session Terminated',
      value: stats.terminatedStudents,
      sublabel: 'Violations resolved',
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="prof-panel p-5 relative overflow-hidden group hover:border-slate-700 transition-colors"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {stat.value || '0'}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                {stat.sublabel}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} border ${stat.border}`}>
              <stat.icon size={20} />
            </div>
          </div>

          {/* Subtle trend line or background element */}
          <div className="absolute -bottom-1 -right-1 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <stat.icon size={80} />
          </div>
        </div>
      ))}
    </div>
  )
}
