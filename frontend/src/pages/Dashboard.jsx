import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const STATUS_COLORS = {
  on_track: { card: 'border-green-400 bg-green-50',  badge: 'bg-green-100 text-green-800' },
  delayed:  { card: 'border-yellow-400 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  critical: { card: 'border-red-400 bg-red-50',      badge: 'bg-red-100 text-red-800' },
  complete: { card: 'border-blue-400 bg-blue-50',    badge: 'bg-blue-100 text-blue-800' },
}

function StatCard({ label, value, sub, color }) {
  const borders = { blue: 'border-l-blue-500', red: 'border-l-red-500', yellow: 'border-l-yellow-500', green: 'border-l-green-500' }
  const bgs     = { blue: 'bg-blue-50', red: 'bg-red-50', yellow: 'bg-yellow-50', green: 'bg-green-50' }
  return (
    <div className={`rounded-lg border border-l-4 ${borders[color]} ${bgs[color]} p-4`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.overview()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading dashboard…</div>
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>

  const spentCr    = (data.total_spent_lakhs / 100).toFixed(1)
  const releasedCr = (data.total_released_lakhs / 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Executive Dashboard</h2>
        <p className="text-sm text-gray-500">Capital Expenditure Overview — Chhattisgarh FY 2024-25</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard color="blue"   label="Total Budget"        value={`₹${data.total_budget_cr.toLocaleString()} Cr`} />
        <StatCard color="green"  label="CapEx Spent"         value={`₹${spentCr} Cr`}      sub={`of ₹${releasedCr} Cr released`} />
        <StatCard color="red"    label="Critical Projects"   value={data.critical_count}    sub="need immediate attention" />
        <StatCard color="yellow" label="CapEx Overdue"       value={data.capex_overdue}     sub={`${data.capex_due_30d} due in 30 days`} />
      </div>

      {/* By status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data.by_status).map(([s, count]) => {
          const c = STATUS_COLORS[s]
          return (
            <Link key={s} to={`/projects?status=${s}`}
              className={`rounded-lg border-l-4 p-4 ${c.card} hover:shadow-md transition-shadow`}>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>
                {s.replace('_', ' ')}
              </span>
              <p className="text-3xl font-bold text-gray-800 mt-2">{count}</p>
              <p className="text-xs text-gray-500">projects →</p>
            </Link>
          )
        })}
      </div>

      {/* Dept breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Department-wise CapEx Status</h3>
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Department', 'Budget (Cr)', 'Released (L)', 'Spent (L)', 'Absorption', 'Projects', 'Critical', 'On Track'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_department.map(d => {
                const abs = d.released_lakhs > 0 ? Math.round((d.spent_lakhs / d.released_lakhs) * 100) : 0
                return (
                  <tr key={d.code} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-800">{d.code}</span>
                      <span className="text-gray-400 text-xs block">{d.name}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">₹{d.budget_cr.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">₹{d.released_lakhs.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">₹{d.spent_lakhs.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(abs, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 tabular-nums">{abs}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{d.total_projects}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {d.critical > 0
                        ? <span className="text-red-600 font-bold">{d.critical}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="text-green-600 font-medium">{d.on_track}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
