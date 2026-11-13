import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'
import { CATEGORIES, STATUSES, PRIORITIES, showError, withSla, isDone } from './shared'

// Admin page: every incident, 6 filters, and an Assign button on each row.
// Backend: GET /api/incidents/search, POST /api/assignments?incidentId=&strategy=
const EMPTY = { incidentId: '', title: '', status: '', priority: '', category: '', technicianId: '' }
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }

export default function AllIncidents() {
  const [filters, setFilters] = useState(EMPTY) // what is typed in the boxes
  const [applied, setApplied] = useState(EMPTY) // what we last searched for
  const [strategy, setStrategy] = useState('SKILL')
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

  async function assign(i) {
    setMessage(null)
    setBusyId(i.id)
    try {
      const tech = await api.assignIncident(i.id, strategy)
      setMessage({ bad: false, text: 'Incident #' + i.id + ' assigned to ' + tech.name + ' (' + strategy + ').' })
      reload()
      techs.reload()
    } catch (e) {
      setMessage({ bad: true, text: 'Incident #' + i.id + ': ' + showError(e) })
    } finally {
      setBusyId(null)
    }
  }

  const actions = (i) => (
    <div className="row">
      <button className="btn small" disabled={isDone(i) || busyId === i.id} onClick={() => assign(i)}>
        {i.assignedTechnician ? 'Reassign' : 'Assign'}
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

      <div className="filters">
        <label>
          Assignment strategy
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="SKILL">SKILL: technician whose skill matches the category</option>
            <option value="LEAST_LOADED">LEAST_LOADED: technician with the fewest active incidents</option>
          </select>
        </label>
      </div>

      {message && <p className={message.bad ? 'bad' : ''} style={message.bad ? null : OK}>{message.text}</p>}
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {rows && <p className="muted">Showing {rows.length} incident{rows.length === 1 ? '' : 's'}.</p>}
      {rows && <IncidentTable incidents={rows} actions={actions} />}
    </>
  )
}
