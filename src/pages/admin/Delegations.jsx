import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import useLoad from '../../components/useLoad'
import { showError } from './shared'

// Admin page: delegation requests from technicians. The incident only moves when you approve.
// Backend: GET /api/assignments/delegations?status=, POST /api/assignments/delegations/{id}/approve|reject
const OK = { color: '#25612f', fontSize: 13, fontWeight: 600 }
const when = (t) => (t ? new Date(t).toLocaleString() : '-')

export default function Delegations() {
  const [filter, setFilter] = useState('PENDING')
  const [message, setMessage] = useState(null) // { text, bad }
  const [busyId, setBusyId] = useState(null)
  const { data, loading, error, reload } = useLoad(() => api.getDelegations(filter), [filter])

  async function decide(d, approve) {
    setMessage(null)
    setBusyId(d.id)
    try {
      if (approve) await api.approveDelegation(d.id)
      else await api.rejectDelegation(d.id)
      setMessage({ bad: false, text: 'Incident #' + d.incidentId + (approve ? ' moved to ' + d.toTechnician.name + '.' : ': request rejected, it stays with ' + d.fromTechnician.name + '.') })
    } catch (e) {
      setMessage({ bad: true, text: 'Incident #' + d.incidentId + ': ' + showError(e) })
    } finally {
      setBusyId(null)
      reload()
    }
  }

  return (
    <>
      <h2>Delegation requests</h2>
      <div className="filters">
        <label>
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="PENDING">Waiting for approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ALL">All</option>
          </select>
        </label>
        <button type="button" className="btn small" onClick={reload}>Refresh</button>
      </div>

      {message && <p className={message.bad ? 'bad' : ''} style={message.bad ? null : OK}>{message.text}</p>}
      {loading && <p>Loading...</p>}
      {error && <p className="bad">{error}</p>}
      {data && data.length === 0 && <p className="muted">No requests here.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr><th>Incident</th><th>From</th><th>To</th><th>Requested</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td><Link to={'/incidents/' + d.incidentId}>#{d.incidentId} {d.incidentTitle}</Link></td>
                <td>{d.fromTechnician?.name}</td>
                <td>{d.toTechnician?.name}</td>
                <td>{when(d.requestedAt)}</td>
                <td>{d.status}{d.decidedBy ? ' by ' + d.decidedBy : ''}</td>
                <td>
                  {d.status === 'PENDING' && (
                    <div className="row">
                      <button className="btn small" disabled={busyId === d.id} onClick={() => decide(d, true)}>Approve</button>
                      <button className="btn small" disabled={busyId === d.id} onClick={() => decide(d, false)}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
