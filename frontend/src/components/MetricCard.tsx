import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'indigo' | 'emerald' | 'amber' | 'rose'
  loading?: boolean
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  loading = false,
}: MetricCardProps) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">{title}</h3>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-3xl font-bold mt-2 text-slate-800">{value}</p>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
