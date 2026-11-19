import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { CATEGORIES, STATUSES, PRIORITIES, showError, withSla, isDone } from './shared'

// Admin page: every incident, 6 filters, and an override control to change the technician.
// Incidents are auto-assigned (skills, then workload) on creation, so there is no Assign button.
// Backend: GET /api/incidents/search, POST /api/assignments/override
const EMPTY = { incidentId: '', title: '', status: '', priority: '', category: '', technicianId: '' }
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

export default function AllIncidents() {
  const [filters, setFilters] = useState(EMPTY) // what is typed in the boxes
  const [applied, setApplied] = useState(EMPTY) // what we last searched for
  const [overrideFor, setOverrideFor] = useState(null) // incident being overridden
  const [newTech, setNewTech] = useState('')
  const [message, setMessage] = useState(null) // { text, bad }
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useLoad(() => api.searchIncidents(applied), [applied])
  const techs = useLoad(() => api.getTechnicians())

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
  const rows = data ? withSla([...data].sort((a, b) => b.id - a.id)) : null

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
        {select('category', 'Category', CATEGORIES)}
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
              {(techs.data || []).filter((t) => t.active !== false).map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({(t.skills || []).join(', ') || 'no skills'}; workload {t.activeIncidentCount ?? 0})</option>
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
