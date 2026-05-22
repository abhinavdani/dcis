import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const ALERT_STYLE = {
  capex_od:    { bar: 'border-l-red-600',    bg: 'bg-red-50',    label: 'CapEx OVERDUE',    labelCls: 'bg-red-600 text-white' },
  capex_7d:    { bar: 'border-l-red-400',    bg: 'bg-red-50',    label: 'Due in 7 days',    labelCls: 'bg-red-400 text-white' },
  capex_15d:   { bar: 'border-l-orange-400', bg: 'bg-orange-50', label: 'Due in 15 days',   labelCls: 'bg-orange-400 text-white' },
  capex_30d:   { bar: 'border-l-yellow-400', bg: 'bg-yellow-50', label: 'Due in 30 days',   labelCls: 'bg-yellow-500 text-white' },
  stage_stuck: { bar: 'border-l-purple-400', bg: 'bg-purple-50', label: 'Stage Stalled',    labelCls: 'bg-purple-400 text-white' },
  no_update:   { bar: 'border-l-gray-400',   bg: 'bg-gray-50',   label: 'No Field Update',  labelCls: 'bg-gray-400 text-white' },
}

const SEVERITY_ORDER = ['capex_od','capex_7d','capex_15d','capex_30d','stage_stuck','no_update']

export default function Alerts() {
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.alerts()
      .then(data => {
        const sorted = [...data].sort((a, b) =>
          SEVERITY_ORDER.indexOf(a.alert_type) - SEVERITY_ORDER.indexOf(b.alert_type)
        )
        setAlerts(sorted)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading alerts…</div>
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>

  const counts = SEVERITY_ORDER.reduce((acc, t) => {
    acc[t] = alerts.filter(a => a.alert_type === t).length
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Active Alerts</h2>
        <p className="text-sm text-gray-500">{alerts.length} unresolved · sorted by severity</p>
      </div>

      {/* Summary chips */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {SEVERITY_ORDER.filter(t => counts[t] > 0).map(t => {
            const s = ALERT_STYLE[t]
            return (
              <span key={t} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.labelCls}`}>
                {s.label}
                <span className="bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full">{counts[t]}</span>
              </span>
            )
          })}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-500 font-medium">No active alerts</p>
          <p className="text-gray-400 text-sm mt-1">All projects are being tracked without issues.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => {
            const s = ALERT_STYLE[a.alert_type] || { bar: 'border-l-gray-300', bg: 'bg-gray-50', label: a.alert_type, labelCls: 'bg-gray-400 text-white' }
            return (
              <div key={a.id} className={`border border-l-4 ${s.bar} ${s.bg} rounded-r-lg px-4 py-3`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.labelCls}`}>{s.label}</span>
                      <Link to={`/projects/${a.project_id}`}
                        className="font-mono text-xs text-blue-700 hover:underline font-semibold">
                        {a.project_code}
                      </Link>
                      <span className="text-xs text-gray-500">{a.district}</span>
                      <span className="bg-white border text-xs px-1.5 py-0.5 rounded text-gray-500">{a.dept}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate">{a.project_name}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.message}</p>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {new Date(a.triggered_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
