import { useState } from 'react'
import { api, errorMessage } from '../../api/client'
import useLoad from '../../components/useLoad'
import IncidentTable from '../../components/IncidentTable'

// PARTNER: this page is yours. Filters call GET /api/incidents/search. Assign calls POST /api/assignments.
const EMPTY = { title: '', status: '', priority: '', category: '' }

export default function AllIncidents() {
  const [filters, setFilters] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [strategy, setStrategy] = useState('SKILL')
  const [message, setMessage] = useState('')
  const { data, loading, error, reload } = useLoad(() => api.searchIncidents(applied), [applied])

  const set = (name) => (e) => setFilters({ ...filters, [name]: e.target.value })

  async function assign(id) {
    setMessage('')
    try {
      const tech = await api.assignIncident(id, strategy)
      setMessage('Incident #' + id + ' assigned to ' + (tech?.name || 'a technician'))
      reload()
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }

  const actions = (i) => (
    <button className="btn small" disabled={!!i.assignedTechnician} onClick={() => assign(i.id)}>Assign</button>
  )

  const options = (name, label, values) => (
    <label>{label}
      <select value={filters[name]} onChange={set(name)}>
        <option value="">All</option>
        {values.map((v) => <option key={v}>{v}</option>)}
      </select>
    </label>
  )

  return (
    <>
      <h2>All incidents</h2>
      <div className="filters">
        <label>Title<input value={filters.title} onChange={set('title')} /></label>
        {options('status', 'Status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])}
        {options('priority', 'Priority', ['P1', 'P2', 'P3', 'P4'])}
        {options('category', 'Category', ['NETWORK', 'HARDWARE', 'SOFTWARE', 'DATABASE', 'SECURITY'])}
        <button className="btn" onClick={() => setApplied(filters)}>Search</button>
        <button className="btn small" onClick={() => { setFilters(EMPTY); setApplied(EMPTY) }}>Clear</button>
        <span className="spacer" />
        <label>Assignment strategy
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="SKILL">SKILL (match skills)</option>
            <option value="LEAST_LOADED">LEAST_LOADED</option>
          </select>
        </label>
      </div>
      {message && <p className="muted">{message}</p>}
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && <IncidentTable incidents={data} actions={actions} />}
    </>
  )
}
