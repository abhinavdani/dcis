import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

const STATUS_COLORS = {
  on_track: 'bg-green-100 text-green-700',
  delayed:  'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
  complete: 'bg-blue-100 text-blue-700',
}

const STAGES = ['need','dpr','admin','tender','wo','execution','milestone','capex','uc']
const STAGE_LABELS = {
  need: 'Need', dpr: 'DPR', admin: 'Approval', tender: 'Tender',
  wo: 'Work Order', execution: 'Execution', milestone: '50% Done',
  capex: 'CapEx Booked', uc: 'UC & Complete',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.project(id)
      .then(setProject)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading project…</div>
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>
  if (!project) return null

  const stageIdx = STAGES.indexOf(project.current_stage)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="text-blue-600 text-sm hover:underline">← All Projects</Link>
          <h2 className="text-xl font-bold text-gray-800 mt-1 leading-tight">{project.name}</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="font-mono text-blue-700">{project.project_code}</span>
            {' · '}{project.district_name}{' · '}{project.department_name}
            {' · '}<span className="uppercase text-xs">{project.scheme}</span>
          </p>
        </div>
        <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[project.status]}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {/* Stage timeline */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lifecycle Stage</h3>
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-0.5 flex-shrink-0">
              <div className={`rounded px-2 py-1 text-xs font-medium whitespace-nowrap
                ${i < stageIdx  ? 'bg-green-500 text-white' :
                  i === stageIdx ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1' :
                  'bg-gray-100 text-gray-400'}`}>
                {STAGE_LABELS[s]}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-3 h-px flex-shrink-0 ${i < stageIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Budget',            `₹${project.budget_lakhs.toLocaleString()} L`, null],
          ['Released',          `₹${project.released_lakhs.toLocaleString()} L`, null],
          ['Spent',             `₹${project.spent_lakhs.toLocaleString()} L`, `${project.absorption_pct}% absorption`],
          ['Physical Progress', `${project.physical_pct}%`, project.capex_due ? `Due: ${project.capex_due}` : 'No deadline set'],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Details */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Details</h3>
          <dl className="space-y-2 text-sm">
            {[
              ['Scheme',       project.scheme],
              ['Funding Model', project.funding_model?.replace(/_/g, ' ')],
              ['Contractor',   project.contractor || '—'],
              ['Work Order',   project.work_order_ref || '—'],
              ['Division',     project.division],
              ['Last Updated', new Date(project.last_updated).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })],
              ['Created',      new Date(project.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="text-gray-400 w-32 flex-shrink-0 text-xs mt-0.5">{k}</dt>
                <dd className="text-gray-700 flex-1">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Alerts */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Open Alerts {project.open_alerts?.length > 0 && (
              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs ml-1">
                {project.open_alerts.length}
              </span>
            )}
          </h3>
          {project.open_alerts?.length > 0 ? (
            <ul className="space-y-2">
              {project.open_alerts.map(a => (
                <li key={a.id} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700 leading-relaxed">
                  <span className="font-semibold uppercase text-red-500 text-xs">{a.alert_type.replace(/_/g, ' ')} · </span>
                  {a.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No open alerts — project is being tracked.</p>
          )}
        </div>
      </div>

      {/* Stage logs */}
      {project.stage_logs?.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stage History</h3>
          <div className="space-y-2">
            {project.stage_logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0 last:pb-0">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
                  {STAGE_LABELS[log.stage] || log.stage}
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap mt-0.5">{log.stage_date}</span>
                <span className="text-gray-600 flex-1 text-xs">{log.remarks || '—'}</span>
                {log.voucher_ref && (
                  <span className="text-gray-400 font-mono text-xs whitespace-nowrap">#{log.voucher_ref}</span>
                )}
                <span className="text-gray-400 text-xs whitespace-nowrap">{log.updated_by_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {project.milestones?.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Field Updates</h3>
          <div className="space-y-2">
            {project.milestones.map(m => (
              <div key={m.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0 last:pb-0">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap flex-shrink-0">
                  {m.physical_pct}%
                </span>
                <span className="text-gray-600 flex-1 text-xs">{m.remark || '—'}</span>
                {m.issue_flag && (
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs whitespace-nowrap">
                    ⚠ {m.issue_type}
                  </span>
                )}
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {new Date(m.captured_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
