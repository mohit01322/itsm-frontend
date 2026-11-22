import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { CATEGORIES, STATUSES, PRIORITIES, showError, withSla, isDone, isFull, workloadText, loadWorkloadLimit } from './shared'

// Admin page: every incident, filters (including a reported-date range), and an override control to change the technician.
// Incidents are auto-assigned (skills, then workload) on creation, so there is no Assign button.
// Backend: GET /api/incidents/search, POST /api/assignments/override
const EMPTY = { incidentId: '', title: '', status: '', priority: '', category: '', technicianId: '', serviceId: '', sla: '', from: '', to: '' }
// The backend search covers the first six filters; Service, SLA status and the date range are applied here in the browser
const SLA_FILTERS = { VIOLATED: 'Violated', AT_RISK: 'At risk (75%+ of time used)', OK: 'Within SLA' }
const backendFilters = ({ serviceId, sla, from, to, ...rest }) => rest
// createdAt looks like "2026-11-22T10:15:30", so its first 10 characters are the date and compare like the date boxes.
// The boxes' min/max stop a "from" date after the "to" date (the browser shows its own message).
const reportedDay = (i) => (i.createdAt || '').slice(0, 10)
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

export default function AllIncidents() {
  const [filters, setFilters] = useState(EMPTY) // what is typed in the boxes
  const [applied, setApplied] = useState(EMPTY) // what we last searched for
  const [overrideFor, setOverrideFor] = useState(null) // incident being overridden
  const [newTech, setNewTech] = useState('')
  const [message, setMessage] = useState(null) // { text, bad }
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useLoad(() => api.searchIncidents(backendFilters(applied)), [applied])
  const techs = useLoad(() => api.getTechnicians())
  const cats = useLoad(() => api.getCategories())
  const services = useLoad(() => api.getServices())
  const limit = useLoad(() => loadWorkloadLimit(api)).data ?? null
  const categoryNames = cats.data ? cats.data.map((c) => c.name) : CATEGORIES

  const set = (name) => (e) => setFilters({ ...filters, [name]: e.target.value })

  function search(e) {
    e.preventDefault()
    setApplied({ ...filters })
  }

  function clear() {
    setFilters(EMPTY)
    setApplied(EMPTY)
  }

  function startOverride(i) {
    setMessage(null)
    setOverrideFor(i)
    setNewTech(i.assignedTechnician ? String(i.assignedTechnician.id) : '')
  }

  async function confirmOverride(e) {
    e.preventDefault()
    if (!newTech) return setMessage({ bad: true, text: 'Choose a technician.' })
    setBusyId(overrideFor.id)
    try {
      const tech = await api.overrideAssignment(overrideFor.id, Number(newTech))
      setMessage({ bad: false, text: 'Incident #' + overrideFor.id + ' reassigned to ' + tech.name + ' (admin override).' })
      setOverrideFor(null)
      reload()
      techs.reload()
    } catch (err) {
      setMessage({ bad: true, text: 'Incident #' + overrideFor.id + ': ' + showError(err) })
    } finally {
      setBusyId(null)
    }
  }

  const actions = (i) => (
    <div className="row">
      <button className="btn small" disabled={isDone(i) || busyId === i.id} onClick={() => startOverride(i)}>
        Override assignment
      </button>
      <Link to={'/admin/audit?incident=' + i.id}>History</Link>
    </div>
  )

  const select = (name, label, values) => (
    <label>
      {label}
      <select value={filters[name]} onChange={set(name)}>
        <option value="">All</option>
        {values.map((v) => <option key={v}>{v}</option>)}
      </select>
    </label>
  )

  // Newest first
  const slaMatches = (i) => !applied.sla
    || (applied.sla === 'VIOLATED' && i.slaViolated)
    || (applied.sla === 'AT_RISK' && !i.slaViolated && !isDone(i) && i.slaRiskLevel === 'HIGH')
    || (applied.sla === 'OK' && !i.slaViolated)
  const rows = data
    ? withSla([...data].sort((a, b) => b.id - a.id))
        .filter((i) => !applied.serviceId || String(i.affectedService?.id) === applied.serviceId)
        .filter(slaMatches)
        .filter((i) => (!applied.from || reportedDay(i) >= applied.from) && (!applied.to || reportedDay(i) <= applied.to))
    : null

  return (
    <>
      <h2>All incidents</h2>

      <form className="filters" onSubmit={search}>
        <label>
          Incident #
          <input type="number" min="1" value={filters.incidentId} onChange={set('incidentId')} style={{ width: 90 }} />
        </label>
        <label>Title<input value={filters.title} onChange={set('title')} placeholder="contains..." /></label>
        {select('status', 'Status', STATUSES)}
        {select('priority', 'Priority', PRIORITIES)}
        {select('category', 'Category', categoryNames)}
        <label>
          Service
          <select value={filters.serviceId} onChange={set('serviceId')}>
            <option value="">All</option>
            {(services.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>
          SLA status
          <select value={filters.sla} onChange={set('sla')}>
            <option value="">All</option>
            {Object.entries(SLA_FILTERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Reported from<input type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} /></label>
        <label>Reported to<input type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} /></label>
        <label>
          Technician
          <select value={filters.technicianId} onChange={set('technicianId')}>
            <option value="">All</option>
            {(techs.data || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <button className="btn">Search</button>
        <button type="button" className="btn small" onClick={clear}>Clear</button>
      </form>

      {overrideFor && (
        <form className="card" onSubmit={confirmOverride} style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Override assignment for #{overrideFor.id} {overrideFor.title}</h3>
          <p className="muted">Currently: {overrideFor.assignedTechnician?.name || 'unassigned'}</p>
          <label>
            New technician
            <select value={newTech} onChange={(e) => setNewTech(e.target.value)}>
              <option value="">Select...</option>
              {/* A technician at the workload limit cannot take more (the backend would refuse) */}
              {(techs.data || []).filter((t) => t.active !== false).map((t) => (
                <option key={t.id} value={t.id} disabled={isFull(t, limit) && t.id !== overrideFor.assignedTechnician?.id}>
                  {t.name} ({(t.skills || []).join(', ') || 'no skills'}; workload {workloadText(t, limit)})
                </option>
              ))}
            </select>
          </label>
          <div className="row">
            <button className="btn" disabled={busyId === overrideFor.id}>Confirm override</button>
            <button type="button" className="btn small" onClick={() => setOverrideFor(null)}>Cancel</button>
          </div>
        </form>
      )}

      {message && <p className={message.bad ? 'bad' : ''} style={message.bad ? null : OK}>{message.text}</p>}
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {rows && <p className="muted">Showing {rows.length} incident{rows.length === 1 ? '' : 's'}.</p>}
      {rows && <IncidentTable incidents={rows} actions={actions} />}
    </>
  )
}
