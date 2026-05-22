import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'

const STATUS_COLORS = {
  on_track: 'bg-green-100 text-green-700',
  delayed:  'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
  complete: 'bg-blue-100 text-blue-700',
}

const STAGE_LABELS = {
  need: 'Need', dpr: 'DPR', admin: 'Approval', tender: 'Tender',
  wo: 'Work Order', execution: 'Execution', milestone: '50% Done',
  capex: 'CapEx', uc: 'Complete',
}

export default function Projects() {
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({
    status: searchParams.get('status') || '',
    dept: '', district: '', scheme: '', stage: '', q: '',
  })

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api.projects(params)
      .then(d => setProjects(d.results || d))
      .finally(() => setLoading(false))
  }, [filters])

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Projects</h2>
        <span className="text-sm text-gray-500">{loading ? '…' : `${projects.length} projects`}</span>
      </div>

      {/* Filter bar */}
      <div className="bg-white border rounded-lg p-3 flex flex-wrap gap-2">
        <input
          type="text" placeholder="Search name / code / district…"
          value={filters.q} onChange={e => setFilter('q', e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1 min-w-52
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {[
          ['status', ['on_track','delayed','critical','complete']],
          ['dept',   ['PWD','PHE','HLT','EDU','RRL','URB']],
          ['scheme', ['NHM','PMGSY','JJM','PMKSY','AMRUT','15FC','SAMAGRA','STATE']],
          ['stage',  ['need','dpr','admin','tender','wo','execution','milestone','capex','uc']],
        ].map(([key, opts]) => (
          <select key={key} value={filters[key]} onChange={e => setFilter(key, e.target.value)}
            className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}: All</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <input
          type="text" placeholder="District…"
          value={filters.district} onChange={e => setFilter('district', e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-32
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ status:'', dept:'', district:'', scheme:'', stage:'', q:'' })}
            className="border rounded px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Code','Project','District','Dept','Budget (L)','Absorption','Stage','Status','CapEx Due','Physical'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-blue-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link to={`/projects/${p.id}`} className="font-mono text-xs text-blue-700 hover:underline">
                      {p.project_code}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 max-w-xs">
                    <Link to={`/projects/${p.id}`} className="text-gray-800 hover:text-blue-700 line-clamp-2 text-xs leading-tight">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{p.district_name}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.department_code}</span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-xs">₹{p.budget_lakhs.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(p.absorption_pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{p.absorption_pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs whitespace-nowrap">
                      {STAGE_LABELS[p.current_stage] || p.current_stage}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {p.capex_due ? (
                      <span className={
                        p.days_to_capex < 0 ? 'text-red-600 font-semibold' :
                        p.days_to_capex < 30 ? 'text-yellow-600' : 'text-gray-600'
                      }>
                        {p.capex_due}
                        <span className="block text-xs opacity-75">
                          {p.days_to_capex < 0
                            ? `${Math.abs(p.days_to_capex)}d overdue`
                            : `${p.days_to_capex}d left`}
                        </span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${p.physical_pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{p.physical_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No projects match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
