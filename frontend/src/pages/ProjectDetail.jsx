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
  need: 'Need Identified', dpr: 'DPR Prepared', admin: 'Admin Approval',
  tender: 'Tender Issued', wo: 'Work Order', execution: 'Execution',
  milestone: '50% Milestone', capex: 'CapEx Booked', uc: 'Completion & UC',
}

function Section({ title, badge, color = 'blue', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = { blue: 'bg-blue-600', green: 'bg-green-600', orange: 'bg-orange-500', purple: 'bg-purple-600' }
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors[color]}`} />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {badge && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 border-t">{children}</div>}
    </div>
  )
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
const btnCls   = "px-4 py-1.5 rounded text-sm font-medium transition-colors"

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Stage update form
  const [stageForm, setStageForm] = useState({ stage: '', stage_date: new Date().toISOString().slice(0,10), done_by_name: '', remarks: '', voucher_ref: '' })
  const [stageSaving, setStageSaving] = useState(false)
  const [stageMsg, setStageMsg] = useState('')

  // Financials form
  const [finForm, setFinForm]   = useState({ released_lakhs: '', spent_lakhs: '', status: '', contractor: '', work_order_ref: '' })
  const [finSaving, setFinSaving] = useState(false)
  const [finMsg, setFinMsg]     = useState('')

  // Milestone form
  const [milForm, setMilForm]   = useState({ physical_pct: '', remark: '', issue_flag: false, issue_type: '' })
  const [milSaving, setMilSaving] = useState(false)
  const [milMsg, setMilMsg]     = useState('')

  function load() {
    setLoading(true)
    api.project(id).then(p => {
      setProject(p)
      setFinForm({
        released_lakhs: p.released_lakhs,
        spent_lakhs:    p.spent_lakhs,
        status:         p.status,
        contractor:     p.contractor || '',
        work_order_ref: p.work_order_ref || '',
      })
      setMilForm(f => ({ ...f, physical_pct: p.physical_pct }))
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function submitStage(e) {
    e.preventDefault()
    if (!stageForm.stage) return
    setStageSaving(true); setStageMsg('')
    try {
      await api.stageUpdate(id, stageForm)
      setStageMsg('Stage updated successfully.')
      load()
    } catch (err) { setStageMsg('Error: ' + err.message) }
    finally { setStageSaving(false) }
  }

  async function submitFinancials(e) {
    e.preventDefault()
    setFinSaving(true); setFinMsg('')
    try {
      await api.updateFinancials(id, {
        released_lakhs: Number(finForm.released_lakhs),
        spent_lakhs:    Number(finForm.spent_lakhs),
        status:         finForm.status,
        contractor:     finForm.contractor,
        work_order_ref: finForm.work_order_ref,
      })
      setFinMsg('Financials updated successfully.')
      load()
    } catch (err) { setFinMsg('Error: ' + err.message) }
    finally { setFinSaving(false) }
  }

  async function submitMilestone(e) {
    e.preventDefault()
    setMilSaving(true); setMilMsg('')
    try {
      await api.addMilestone(id, {
        physical_pct: Number(milForm.physical_pct),
        remark:       milForm.remark,
        issue_flag:   milForm.issue_flag,
        issue_type:   milForm.issue_type,
      })
      setMilMsg('Field update logged successfully.')
      setMilForm(f => ({ ...f, remark: '', issue_flag: false, issue_type: '' }))
      load()
    } catch (err) { setMilMsg('Error: ' + err.message) }
    finally { setMilSaving(false) }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading project…</div>
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>
  if (!project) return null

  const stageIdx = STAGES.indexOf(project.current_stage)

  return (
    <div className="space-y-4">
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
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Stage</h3>
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-0.5 flex-shrink-0">
              <div className={`rounded px-2 py-1 text-xs font-medium whitespace-nowrap
                ${i < stageIdx  ? 'bg-green-500 text-white' :
                  i === stageIdx ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1' :
                  'bg-gray-100 text-gray-400'}`}>
                {STAGE_LABELS[s].split(' ')[0]}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-3 h-px flex-shrink-0 ${i < stageIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Budget',    `₹${project.budget_lakhs.toLocaleString()} L`, null],
          ['Released',  `₹${project.released_lakhs.toLocaleString()} L`, null],
          ['Spent',     `₹${project.spent_lakhs.toLocaleString()} L`, `${project.absorption_pct}% absorbed`],
          ['Physical',  `${project.physical_pct}%`, project.capex_due ? `Due ${project.capex_due}` : null],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-white border rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase">{label}</p>
            <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── ACTION FORMS ── */}

      {/* 1. Advance Stage */}
      <Section title="Advance Stage" color="blue" badge={STAGE_LABELS[project.current_stage]}>
        <form onSubmit={submitStage} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Move to Stage *">
              <select value={stageForm.stage} onChange={e => setStageForm(f => ({...f, stage: e.target.value}))}
                className={inputCls} required>
                <option value="">Select next stage…</option>
                {STAGES.map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Stage Date *">
              <input type="date" value={stageForm.stage_date}
                onChange={e => setStageForm(f => ({...f, stage_date: e.target.value}))}
                className={inputCls} required />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Done By (Name)">
              <input type="text" placeholder="Officer name" value={stageForm.done_by_name}
                onChange={e => setStageForm(f => ({...f, done_by_name: e.target.value}))}
                className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Voucher / Reference No.">
              <input type="text" placeholder="e.g. WO/2024/001" value={stageForm.voucher_ref}
                onChange={e => setStageForm(f => ({...f, voucher_ref: e.target.value}))}
                className={inputCls} />
            </FieldGroup>
          </div>
          <FieldGroup label="Remarks">
            <textarea value={stageForm.remarks}
              onChange={e => setStageForm(f => ({...f, remarks: e.target.value}))}
              className={inputCls} rows={2} placeholder="Add any remarks…" />
          </FieldGroup>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={stageSaving}
              className={`${btnCls} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}>
              {stageSaving ? 'Saving…' : 'Update Stage'}
            </button>
            {stageMsg && <span className={`text-sm ${stageMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{stageMsg}</span>}
          </div>
        </form>
      </Section>

      {/* 2. Update Status & Financials */}
      <Section title="Update Status & Financials" color="orange" badge={project.status.replace('_',' ')}>
        <form onSubmit={submitFinancials} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <FieldGroup label="Project Status">
              <select value={finForm.status} onChange={e => setFinForm(f => ({...f, status: e.target.value}))}
                className={inputCls}>
                <option value="on_track">On Track</option>
                <option value="delayed">Delayed</option>
                <option value="critical">Critical</option>
                <option value="complete">Complete</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Released (₹ Lakhs)">
              <input type="number" value={finForm.released_lakhs}
                onChange={e => setFinForm(f => ({...f, released_lakhs: e.target.value}))}
                className={inputCls} min={0} />
            </FieldGroup>
            <FieldGroup label="Spent (₹ Lakhs)">
              <input type="number" value={finForm.spent_lakhs}
                onChange={e => setFinForm(f => ({...f, spent_lakhs: e.target.value}))}
                className={inputCls} min={0} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Contractor Name">
              <input type="text" value={finForm.contractor}
                onChange={e => setFinForm(f => ({...f, contractor: e.target.value}))}
                className={inputCls} placeholder="e.g. M/s ABC Construction" />
            </FieldGroup>
            <FieldGroup label="Work Order Reference">
              <input type="text" value={finForm.work_order_ref}
                onChange={e => setFinForm(f => ({...f, work_order_ref: e.target.value}))}
                className={inputCls} placeholder="e.g. WO/PWD/2024/042" />
            </FieldGroup>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={finSaving}
              className={`${btnCls} bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50`}>
              {finSaving ? 'Saving…' : 'Update Financials'}
            </button>
            {finMsg && <span className={`text-sm ${finMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{finMsg}</span>}
          </div>
        </form>
      </Section>

      {/* 3. Log Field Update / Milestone */}
      <Section title="Log Field Update" color="green" badge={`${project.physical_pct}% physical`}>
        <form onSubmit={submitMilestone} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Physical Progress (%) *">
              <input type="number" value={milForm.physical_pct}
                onChange={e => setMilForm(f => ({...f, physical_pct: e.target.value}))}
                className={inputCls} min={0} max={100} required />
            </FieldGroup>
            <FieldGroup label="Issue Type (if any)">
              <select value={milForm.issue_type}
                onChange={e => setMilForm(f => ({...f, issue_type: e.target.value, issue_flag: e.target.value !== ''}))}
                className={inputCls}>
                <option value="">No issue</option>
                <option value="contractor">Contractor</option>
                <option value="material">Material</option>
                <option value="land">Land Acquisition</option>
                <option value="fund">Fund Release</option>
                <option value="security">Security / LWE</option>
                <option value="other">Other</option>
              </select>
            </FieldGroup>
          </div>
          <FieldGroup label="Remarks / Site Observation">
            <textarea value={milForm.remark}
              onChange={e => setMilForm(f => ({...f, remark: e.target.value}))}
              className={inputCls} rows={2} placeholder="Describe current site status…" />
          </FieldGroup>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={milSaving}
              className={`${btnCls} bg-green-600 text-white hover:bg-green-700 disabled:opacity-50`}>
              {milSaving ? 'Saving…' : 'Log Field Update'}
            </button>
            {milMsg && <span className={`text-sm ${milMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{milMsg}</span>}
          </div>
        </form>
      </Section>

      {/* Project info + Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Details</h3>
          <dl className="space-y-2 text-sm">
            {[
              ['Scheme',       project.scheme],
              ['Funding',      project.funding_model?.replace(/_/g,' ')],
              ['Contractor',   project.contractor || '—'],
              ['Work Order',   project.work_order_ref || '—'],
              ['Last Updated', new Date(project.last_updated).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})],
            ].map(([k,v]) => (
              <div key={k} className="flex gap-3">
                <dt className="text-gray-400 w-28 flex-shrink-0 text-xs mt-0.5">{k}</dt>
                <dd className="text-gray-700 flex-1">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Open Alerts {project.open_alerts?.length > 0 &&
              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-xs ml-1">{project.open_alerts.length}</span>}
          </h3>
          {project.open_alerts?.length > 0 ? (
            <ul className="space-y-2">
              {project.open_alerts.map(a => (
                <li key={a.id} className="bg-red-50 border border-red-100 rounded px-3 py-2 text-xs text-red-700">
                  <span className="font-semibold uppercase">{a.alert_type.replace(/_/g,' ')} · </span>{a.message}
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-400 text-sm">No open alerts.</p>}
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
                  {STAGE_LABELS[log.stage]?.split(' ')[0] || log.stage}
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap mt-0.5">{log.stage_date}</span>
                <span className="text-gray-600 flex-1 text-xs">{log.remarks || '—'}</span>
                {log.voucher_ref && <span className="text-gray-400 font-mono text-xs">#{log.voucher_ref}</span>}
                <span className="text-gray-400 text-xs whitespace-nowrap">{log.updated_by_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {project.milestones?.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Field Update History</h3>
          <div className="space-y-2">
            {project.milestones.map(m => (
              <div key={m.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0 last:pb-0">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex-shrink-0">{m.physical_pct}%</span>
                <span className="text-gray-600 flex-1 text-xs">{m.remark || '—'}</span>
                {m.issue_flag && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs">⚠ {m.issue_type}</span>}
                <span className="text-gray-400 text-xs whitespace-nowrap">{new Date(m.captured_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
