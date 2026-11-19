import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'

// Admin page: the full history of one incident, newest first.
// Backend: GET /api/audit/{incidentId} (admin only)

// "TECHNICIAN_ASSIGNED" -> "Technician assigned"
function niceAction(action) {
  const s = (action || '').replaceAll('_', ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function AuditLog() {
  // The chosen incident is kept in the address bar (?incident=5), so the History link on All incidents can open it.
  const [params, setParams] = useSearchParams()
  const id = params.get('incident') || ''

  const incidents = useLoad(() => api.getIncidents())
  const history = useLoad(() => (id ? api.getAudit(id) : Promise.resolve(null)), [id])

  const options = incidents.data ? [...incidents.data].sort((a, b) => b.id - a.id) : []
  const rows = history.data ? [...history.data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : null
  const showBy = rows?.some((r) => r.performedBy) // the real backend does not record who did it yet

  return (
    <>
      <h2>Audit log</h2>
      <div className="filters">
        <label>
          Incident
          <select value={id} onChange={(e) => setParams(e.target.value ? { incident: e.target.value } : {})}>
            <option value="">Choose an incident...</option>
            {options.map((i) => <option key={i.id} value={i.id}>#{i.id} {i.title}</option>)}
          </select>
        </label>
      </div>

      {incidents.error && <p className="bad">{incidents.error}</p>}
      {!id && <p className="muted">Pick an incident to see everything that happened to it, newest first.</p>}
      {id && history.loading && <p>Loading...</p>}
      {history.error && <p className="bad">{history.error}</p>}
      {rows && !rows.length && <p className="muted">No audit records for this incident.</p>}
      {rows && rows.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Action</th>{showBy && <th>By</th>}<th>Details</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{niceAction(r.action)}</td>
                  {showBy && <td>{r.performedBy || '-'}</td>}
                  <td>{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
